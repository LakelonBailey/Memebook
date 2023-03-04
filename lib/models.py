# Django Imports
from django.db.models import Model
from django.db.models.fields.files import ImageFieldFile, FieldFile
from django.db.models import ForeignObjectRel


class BaseClass(Model):

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
        model_dict = {}
        fields = []
        model_to_dict = self

        # Initalize model types to ignore in nested models
        if not model_types:
            model_types = [type(model_to_dict)]

        # Assume these attributes need to be excluded
        auto_exclude = ['_state']

        # Add auto exclusions to exclude
        for exclusion in auto_exclude:
            if exclusion not in exclude:
                exclude.append(exclusion)

        # Handle sub exclusions, such as student__first_name
        sub_exclude = {}
        for item in [*exclude]:
            if '__' in item:
                # Gather sub model and persist remainder
                sub_model, *remainder = item.split('__')
                remainder = "__".join(remainder)

                # Assign exclusion
                sub_exclusions = sub_exclude.get(sub_model, [])
                sub_exclusions.append(remainder)
                sub_exclude[sub_model] = sub_exclusions
                exclude.remove(item)

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
        fields = [field for field in fields if field not in exclude]

        # Get intersection of args and fields
        if args:
            fields = [field for field in args if field in fields]

        if '_prefetched_objects_cache' not in fields:
            fields.append('_prefetched_objects_cache')

        # Gather attributes into dictionary
        for field in fields:
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
                        if queryset and not type(queryset[0]) in model_types:
                            for queried_model in queryset:
                                additional_types = [*model_types, type(queried_model)]

                                # Gather data
                                if keep_related:
                                    model_dict[key].append(
                                        queried_model.dict(
                                            keep_related=True,
                                            model_types=additional_types,
                                            exclude=queryset_exclude
                                        ))
                                else:
                                    model_dict[key].append(queried_model.uuid)
                    continue

                # Avoid image field files - need to expand this to check for all file fields
                if isinstance(value, ImageFieldFile) or isinstance(value, FieldFile):
                    continue

                # Handle relational fields
                if issubclass(type(value), Model):
                    value = value.dict(
                        keep_related=True,
                        model_types=model_types,

                        # Include sub exclusions
                        exclude=sub_exclude.get(field, [])
                    ) if keep_related else value.pk

                model_dict[field] = value
            except AttributeError:
                continue
        return model_dict