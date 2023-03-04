from django.views import View
from django.http import Http404, JsonResponse
from lib.utils import get_model
from django.db import models
import json


class GeneralAPI(View):
    def convert(self, val):
        conversions = {
            'true': True,
            'True': True,
            'false': False,
            'False': False,
            'null': None,
        }
        return conversions.get(val, val)

    def convert_list(self, item, separator=',', default=[], new_name=None):
        name = new_name if new_name else item
        value = self.params.pop(item, 'unfound')
        if value == 'unfound':
            setattr(self, name, default)
            return

        setattr(self, name, list(map(
            lambda item: item.strip(),
            value.split(separator) if value else []
        )))

    def parse_aggregate(self, agg_field):
        setattr(self, agg_field, {})
        agg_string = self.params.pop(agg_field, False)
        if not agg_string:
            return

        aggregates = json.loads(agg_string)
        for name, info in aggregates.items():
            aggregator, field = list(info.items())[0]
            agg_func = getattr(models, aggregator, None)
            if agg_func is None:
                continue
            aggregates[name] = agg_func(field)

        setattr(self, agg_field, aggregates)

    def parse_params(self, request):
        self.params = request.GET.dict()

        self.count = self.convert(self.params.pop('count', False))

        # List settings
        self.convert_list('exclude')
        self.convert_list('order_by', default=None)
        self.convert_list('prefetch_related')
        self.convert_list('select_related')
        self.convert_list('distinct', default=None)

        # Aggregator settings
        self.parse_aggregate('annotations')
        self.parse_aggregate('aggregations')

        # Pagination parameters
        self.skip = int(self.params.pop('skip', 0))
        self.take = int(self.params.pop('take', 0))

        # Serialization parameters
        self.keep_related = self.convert(self.params.pop('keep_related', False))
        self.custom_serializer = self.convert(self.params.pop('custom_serializer', False))
        self.list_values = self.convert(self.params.pop('list_values', False))
        self.flatten_values = self.convert(self.params.pop('flatten_values', False))


        # Handle value selections
        self.value_annotations = {}
        self.values = []
        values = self.params.pop('values', '')
        values = values.split(',') if values else []
        for value in values:
            value = value.strip()

            # Handle access of sub values. This method is more performant
            # than wrapping this functionality into BaseClass.dict() method.
            if '__' in value:
                self.value_annotations[value] = models.F(value)

            # Handle regular field
            elif value not in self.exclude:
                self.values.append(value)

        self.filter = json.loads(self.params.pop('filter', "{}"))

    # Use custom serializer
    def custom_serialize(self, obj):
        select_values = [
            *self.values,
            *self.value_annotations.keys()
        ]

        return obj.dict(
            *select_values,
            exclude=[*self.exclude],
            keep_related=self.keep_related,
        )

    # Limit data
    def limit(self, data):
        if self.take:
            return data[(self.skip):(self.take)]

        return data[(self.skip):]

    def generate_query(self):
        self.query = self.model.objects.filter(**self.filter)
        if self.order_by is not None and len(self.order_by) == 0:
            self.query = self.query.order_by()

        if self.value_annotations and self.custom_serializer:
            self.query = self.query.annotate(
                **self.value_annotations,
            )
        if self.prefetch_related:
            self.query = self.query.prefetch_related(
                *self.prefetch_related
            )
        if self.select_related:
            self.query = self.query.select_related(
                *self.select_related
            )

        if self.annotations:
            self.query = self.query.annotate(
                **self.annotations
            )

        if self.aggregations:
            self.query = self.query.aggregate(
                **self.aggregations
            )

        if self.order_by is not None and len(self.order_by) > 0:
            self.query = self.query.order_by(*self.order_by)

    def get(self, request, model_name):
        response_data = {}

        # Get model and fields
        self.model = get_model(model_name)
        if self.model is None:
            return Http404()
        self.model_fields = self.model().get_fields()

        # Parse parameters and generate query
        self.parse_params(request)
        self.generate_query()

        # Store query info
        response_data['query'] = {
            'filter': self.filter,
            'values': self.values,
            'keep_related': self.keep_related,
            'exclude': self.exclude
        }

        # Return count if specified
        if self.count:
            response_data['count'] = data.count()
            return JsonResponse(response_data)

        if self.aggregations:
            response_data['data'] = self.query
            return JsonResponse(response_data)

        # Serialize...
        # Use custom serializer
        if self.custom_serializer:
            data = map(self.custom_serialize, self.limit(self.query))

        # Use Django values_list()
        else:
            if self.distinct is not None:
                self.query = self.query.distinct(*self.distinct)
            print(self.list_values)
            if self.list_values:
                data = self.limit(self.query.values_list(
                    *self.values,
                    *self.value_annotations.keys(),
                    flat=self.flatten_values
                ))
            else:
                data = self.limit(self.query.values(
                    *self.values,
                    *self.value_annotations.keys()
                ))

        response_data['data'] = list(data)
        response_data['count'] = len(response_data['data'])

        return JsonResponse(response_data)