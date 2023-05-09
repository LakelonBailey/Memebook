from django.apps import apps
from django.core.exceptions import AppRegistryNotReady
from main.models import *
from django.db import models
from functools import reduce
from operator import or_


def get_model(model_name):
    try:
        # Iterate over all installed apps and their models
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                # Check if the model's name matches the specified name
                if model.__name__ == model_name:
                    return model
    except AppRegistryNotReady:
        # If the app registry is not ready, return None
        return None

    # If no model was found, raise a LookupError
    raise LookupError("General API model not found: {}".format(model_name))


def distinct_models(queryset):
    visited = {}
    models = []
    for obj in queryset:
        is_visited = visited.get(str(obj.pk), False)
        if not is_visited:
            models.append(obj)
            visited[str(obj.pk)] = True

    return models


def dynamic_filter(search_input, search_fields):
    search_filters = []

    # If there is search input, create queries to filter friend objects by search terms and fields
    if search_input:
        terms = [term.strip() for term in search_input.split(' ') if term]

        # Create a list of queries, one for each term and field combination, to filter friend objects
        queries = [Q(**{f'{field}__icontains': t}) for t in terms for field in search_fields]

        # Combine the queries with OR statements and add them to the search filters list
        search_filters.append(reduce(or_, queries))

    return search_filters
