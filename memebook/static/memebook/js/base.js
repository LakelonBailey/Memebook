/*
IGNORE THIS FILE

This code was copy/pasted to this repository from one of Lakelon Bailey's work applications.
This code was NOT developed for this project. It is simply a library of highly-generalized helper functions

*/

function camelToUnderscore(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}


class GeneralAPIRequest {
  constructor (modelName, inputOptions={}) {
    if (!modelName) {
          throw new Error("Model name not provided.");
      }

      this.defaults = {
          values: [],
          exclude: [],
          count: false,
          skip: 0,
          take: 0,
          listValues: false,
          flattenValues: false,
          customSerializer: false,
          keepRelated: false,
          prefetchRelated: [],
          selectRelated: [],
          filter: {},
          annotations: {},
          aggregations: {},
          filterProfile: false
      }

      this.options = {};
      this.modelName = modelName;
      this.update(inputOptions);
  }

  update(updatedOptions) {
      for (let [field, val] of Object.entries(updatedOptions)) {
          this.options[field] = val;
      }
      for (let [field, val] of Object.entries(this.defaults)) {
          if (this.options[field] == undefined) {
              this.options[field] = val;
          }
      }
  }

  getParams() {
      let searchParams = {}
      Object.entries(this.options).forEach(([field, val]) => {
          if (Array.isArray(val)) {
              val = val.join(',');
          }
          else if (['filter', 'annotations', 'aggregations'].includes(field)) {
              val = JSON.stringify(val);
          }
          searchParams[camelToUnderscore(field)] = val;
      })
      return new URLSearchParams(searchParams);
  }

  getUrl() {
      const url = `/api/general/${this.modelName}/?${this.getParams().toString()}`
      return url;
  }

  async send() {
      return await sendGet(this.getUrl());
  }
}

// Sweet Alerts
const swalConfirm = Swal.mixin({
  customClass: {
    confirmButton: 'button is-success m-1',
    denyButton: 'button is-danger m-1',

  },
  buttonsStyling: false
})
const swalNotif = Swal.mixin({
  customClass: {
      confirmButton: 'button is-info m-1'
  }
})


/*
Creates an object from a form element.

Object structure:
{
  <element name property>: <element value>
}
*/
const getFormData = formId => {
  const formData = {};
  formId = formId.replace('#', '');
  const conversions = {
    'true': true,
    'false': false
  }
  $(`#${formId} :input`).each((index, el) => {

    if ($(el).is('input')) {
      const type = $(el).attr('type');
      const data = $(el).data();

      if (type == 'checkbox') {
        formData[$(el).attr('name')] = ($(el).prop('checked') ? true : false);
      }

      else if (type == 'radio') {
        if ($(el).prop('checked')) {
          if (['yes', 'Yes', 'No', 'no'].includes($(el).val())) {
            formData[$(el).attr('name')] = ['Yes', 'yes'].includes($(el).val());
          }
          else {
            formData[$(el).attr('name')] = $(el).val();
          }
        }
      }

      else {
        if (data.type) {
          formData[$(el).attr('name')] = (
            data.type == "int"
            ? parseInt($(el).val())
            : parseFloat($(el).val())
            )
            return true;
        }
        formData[$(el).attr('name')] = $(el).val().trim();
      }
    }

    if ($(el).is('select') || $(el).is('textarea')) {
      let val = $(el).val();
      if (val in conversions) {
        val = conversions[val];
      }
      formData[$(el).attr('name')] = val;
    }

  })

  return formData;

}


/*
Does the opposite of getFormData:
  - Takes an object of key value pairs and
    fills form input values by matching keys
    to input element "name" properties
*/
const fillForm = (formId, data) => {
  formId = formId.replace('#', '');
  $(`#${formId} :input`).each((index, element) => {
    const el = $(element);
    if (el.attr('name') in data) {
      if (el.is('input') && ['checkbox', 'radio'].includes(el.attr('type'))) {
        if (el.attr('type') == 'checkbox') {
          el.prop('checked', data[el.attr('name')])
        }
        if (el.attr('type') == 'radio') {
          if (['yes', 'Yes'].includes(el.val())) {
            if (data[el.attr('name')]) {
              el.prop('checked', true);
            }
          }
          else if (['no', 'No'].includes(el.val())) {
            if (!data[el.attr('name')]) {
              el.prop('checked', true);
            }
          }
          else if (el.val() == data[el.attr('name')]) {
            el.prop('selected', true)
          }
        }
      }
      else if (!el.is('button')) {
        el.val(data[el.attr('name')].toString());
      }
    }
  })
}

// Clears a form of all input values
// as if it had not been touched by the user
const clearForm = (formId) => {
  const id = formId.replace('#', '');
  $(`#${id} :input`).each((index, element) => {
    const el = $(element);
    if (el.is('input')) {
      el.removeAttr('checked');
      if (!(el.attr('type') == 'radio')) {
        el.val('');
      }
    }

    if (el.is('select')) {
      el.val('');
    }

    if (el.is('textarea')) {
      el.val('');
    }
  })
}

// Use a regular expression to check if a given string
// is a properly formatted email
const isEmail = email => {
  return email.toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )
}

// Retrieve CSRF token value from template
const getCSRF = () => {
  const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;
  return csrfToken
}

// Display a Toastify toast indicating an error
const errorToast = errorMessage => {
  Toastify({
    text: errorMessage || "We experienced an error, please try again.",
    duration: 3000,
    close: true,
    gravity: "bottom",
    position: "right",
    style: {
        background: "#ec363a",
    },
    onClick: function() {

    }
  }).showToast();
}

// Send a POST request
const sendPost = async (url, data, errorMessage=false) => {

  // Send request
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'X-CSRFToken': getCSRF(),
      'mode': 'same-origin',
      'Accept': 'application/json'
    }
  })

  if (response.ok) {

    // Attach json response as a "data" property if necessary
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes('application/json')) {
      response.data = await response.json();
      if (response.hasOwnProperty('success') && !response.data.success) {
        errorToast(response.data.msg);
        response.ok = false;
      }
    }
    return response;
  } else {

    // Display error toast on bad request
    errorToast(errorMessage);
  }
  return response
}

// Send a GET request
const sendGet = async (url, errorMessage=false) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
        'X-CSRFToken': getCSRF(),
        'mode': 'same-origin',
        'Accept': 'application/json'
    },
  })

  // Attach json response as a "data" property if necessary
  if (res.ok) {
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes('application/json')) {
      const data = await res.json()
      res.data = data;
    }
    return res
  }
  else {

    // Display error toast on bad request
    errorToast(errorMessage);
    return res;
  }
}

// Send a DELETE request
const sendDelete = async (url, data=false) => {
  // Develop params
  const params = {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': getCSRF(),
      'mode': 'same-origin',
      'Accept': 'application/json'
    },
  }
  if (data) {
    params.body = JSON.stringify(data);
  }

  // Send request
  const res = await fetch(url, params);
  if (res.ok) {

    // Attach json response as a "data" property if necessary
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json()
      res.data = data;
    }
  }
  else {

    // Display error toast on bad request
    errorToast();
  }

  return res;
}

const savedToast = (milliseconds=3000) => {
  Toastify({
    text: "Saved!",
    duration: milliseconds,
    gravity: "bottom",
    position: "right",
    style: {
        background: "#48c774",
    },
    onClick: function() {

    }
  }).showToast();
}


(function($) {
$(document).ready(function() {

  $(".navbar-burger").click(function() {
    // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });
  $('.navbar-menu .navbar-item').click(function() {
    $('.navbar-menu').toggleClass('is-active');
    $(".navbar-burger").toggleClass("is-active");
  })
  $('.tab').addClass('box');

  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });
});
})(jQuery)