define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
    "html_editor", "meta4beta/view/form/FormFields"
],
    function ($, _, Backbone, Marionette, scorpio4, ux, html_editor, FormFields) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var DEBUG = true

    var fields = ux.view.fields = ux.view.fields || {}

    fields.HTML = ux.view.FormField.extend({
        template: "<div class='col-sm-12'><div class='form-control htmlEditor' placeholder='{{comment}}' cols='{{default 'cols' 40}}' rows='{{default 'rows' 5}}' name='{{id}}'></div></div><div class='message error'>{{message}}</div>",
        commit: function($field) {
            $field = $field || $("[name]", this.$el);

            var model = this.options.formModel
            var fieldId = this.options.id
            var value = $field.code()
            invalid = this.validate(value, model)
            if (!invalid || !invalid.message) {
console.log("Commit HTML(%s) %o %o", fieldId, $field, value)
                model.set(fieldId, value)
            }
            return invalid
        },
        onRender: function() {
            var self = this
            $field = $("[name]", this.$el);
            $field.html(this.options.formModel.get(this.options[idAttribute]))

            var _options = _.extend({airMode: false, onblur: function() {
                console.log("HTML commit() %o", self, $field)
                self.commit($field)
            }},this.options.options )
// console.log("Render HTML Editor() %o", _options)
            $(".htmlEditor", this.$el).summernote(_options)
        }
    })

 	return ux;
})
