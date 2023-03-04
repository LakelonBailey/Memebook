from django.apps import apps
from django.core.exceptions import AppRegistryNotReady


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
