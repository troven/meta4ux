define(["jquery", "underscore", "backbone", "marionette", "core", "ux", "meta4/model/validates",
        "meta4/widget/form2/FieldSet",
        "meta4/widget/form2/FormFields",
        "meta4/widget/form2/FormValidate",
        "meta4/widget/PickList",
        "meta4/widget/form2/HTMLEditor"
    ],
    function ($, _, Backbone, Marionette, core, ux, validate, FieldSet, FormFields) {

    return function(options, navigator) {

       // var TEMPLATE_FORM = ux.compileTemplate("<div class='form'><div class='form_header'>header</div><div class='form_body'>body</div><div class='form_footer'>footer</div></div>");
        var TEMPLATE_FORM = ux.compileTemplate("<div class='form_body'>missing fields</div>");

        var FormLayout = Marionette.View.extend({
            isActionable: true, isNested: true, isButtonContext: true,
            regions: {body: ".form_body"},
//           regions: {header: ".form>.form_header", body: ".form>.form_body", footer: ".form>.form_footer"},
           template: TEMPLATE_FORM,
            tagName: "div",
            events: {
                "blur [name]": "doBlurFieldEvent",
                "click [data-trigger]": "doAction",
                "click [data-action]": "doAction"
            },
            initialize: function (_options) {
                var self = this;
                _.defaults(_options, { debug: true, buttons: "buttons", model: false, views: {}, can: { edit: true }, editable: true, autoCommit: true, autoValidate: true, field: {css: "row"} });

                ux.initialize(this, _options, navigator);

                if (!this.model) throw "meta4:ux:oops:missing-model#" + _options.id

                var Fields = new ux.view.FieldSet( _options, navigator);
                this.fieldset = new Fields(_options, { model: this. model });

                console.log("[Form2] init: %o -> %o", this, _options);

                // if ( !(this.options.buttons === false) ) {
                //     this.buttonsView = this.getButtonsWidget("form:save");
                // }

                var footer = _.extend({ id: this.id+"#buttons", debug: false, widget: "Buttons",
                    collection: this.getButtonsCollection("form:save") }, this._views.footer );

                this.footerView = this.getNestedView(footer);

                this.model.on("invalid", function () {
                    alert("invalid");
                    self.triggerMethod("invalid");
                });

                return this;
            },

            getFooter: function() {
                return this.footerView;
            },

            onAttach: function () {
                this.showChildView("body", this.fieldset);
//                console.log("onAttached: footerView %s -> %o", this.id, this.footerView);
//                this.showChildView("footer", footerView);
            },


        });

        return FormLayout;
    }

})
