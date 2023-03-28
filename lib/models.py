# Django Imports
from django.db.models import Model, UUIDField, DateTimeField
from django.db.models.fields.files import ImageFieldFile, FieldFile, FileField
from django.contrib import admin
from django.db.models import ForeignObjectRel
import uuid

# Package Imports
import inspect, importlib


class BaseClass(Model):
    uuid = UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def get_fields(self, dict=False):
        if dict:
            return list(self.__dict__.keys())
        fields = []
        for field in self._meta.get_fields():
            if (isinstance(field, ForeignObjectRel)):
                fields.append(field.related_name)
                continue
            fields.append(str(field).split('.')[2])
        return fields

    def dict(self, *args, exclude=[], keep_related=False, model_types=[]):

        def handle_sub_fields(field_list, sub_dict):
            for item in [*field_list]:
                if '__' in item:
                    sub_model, *remainder = item.split('__')
                    remainder = "__".join(remainder)
                    sub_list = sub_dict.get(sub_model, [])
                    sub_list.append(remainder)
                    sub_dict[sub_model] = sub_list
                    field_list.remove(item)

        model_dict = {}
        include = set(args)
        model_to_dict = self
        exclude = set(exclude)

        # Initalize model types to ignore in nested models
        if not model_types:
            model_types = [type(model_to_dict)]

        # Assume these attributes need to be excluded
        auto_exclude = ['_state']
        exclude = exclude.union(auto_exclude)

        # Handle sub exclusions, such as student__first_name
        sub_exclude = {}
        sub_include = {}
        handle_sub_fields(exclude, sub_exclude)

        if include:
            handle_sub_fields(include, sub_include)
        else:
            # Get normal model attributes
            fields = []
            default_fields = self.get_fields()

            # Clean fields
            for field in self.__dict__.keys():
                clean_field = field.replace('_id', '')
                if (clean_field in default_fields):
                    fields.append(clean_field)
                else:
                    fields.append(field)

            # Exclude fields
            include = set(fields)
            include.add('_prefetched_objects_cache')
            include = include.difference(exclude)

        # Gather attributes into dictionary
        for field in include:
            try:
                value = getattr(model_to_dict, field, "Null Field")
                if value == "Null Field":
                    continue

                # Ignore already gathered types
                if type(value) in model_types:
                    continue

                # Handle prefetch
                if field == "_prefetched_objects_cache":
                    for key,queryset in getattr(model_to_dict, '_prefetched_objects_cache').items():
                        if key in exclude:
                            continue
                        model_dict[key] = []

                        # Handle sub exclusions, such as stat_collections__hours_worked
                        queryset_exclude = sub_exclude.get(key, [])
                        queryset_include = sub_include.get(key, [])

                        if queryset and not type(queryset[0]) in model_types:
                            for queried_model in queryset:
                                additional_types = [*model_types, type(queried_model)]

                                # Gather data
                                if keep_related:
                                    model_dict[key].append(
                                        queried_model.dict(
                                            *queryset_include,
                                            keep_related=True,
                                            model_types=additional_types,
                                            exclude=queryset_exclude
                                        ))
                                else:
                                    model_dict[key].append(queried_model.uuid)
                    continue

                # Avoid image field files - need to expand this to check for all file fields
                if isinstance(value, FieldFile):
                    if hasattr(value, 'url'):
                        value = value.url
                    else:
                        continue

                # Handle relational fields
                if issubclass(type(value), Model):
                    value = value.dict(
                        *sub_include.get(field, []),
                        keep_related=True,
                        model_types=model_types,

                        # Include sub exclusions
                        exclude=sub_exclude.get(field, [])
                    ) if keep_related else value.pk

                model_dict[field] = value
            except AttributeError:
                continue
        return model_dict


def register_models(file_name, exclude=[]):
    for name, model in inspect.getmembers(importlib.import_module(file_name), inspect.isclass):
        if model.__module__ == file_name and issubclass(type(model), Model) and model not in exclude:
            admin.site.register(model)


def paginate_query(query, params):
    num_results = query.count()
    page_size = int(params['size'])
    num_pages = num_results / page_size
    num_pages += bool(num_results%page_size)
    first_item = (int(params['page']) -1) * page_size
    last_item = first_item + page_size
    return (query[first_item:last_item], num_pages)
