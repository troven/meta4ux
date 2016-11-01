define(["underscore", "core"], function (_, core) {

    var fact = core.fact;

    return {
        "required": {
            message: "required",
            fn: function(v) { return v===false||v?true:false }
        },
        "email": {
            message: "invalid email address",
            pattern: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
        },
        "url": {
            message: "not valid URL",
            pattern: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
        },
        "id": {
            message: "Invalid ID [4+ characters, A-Z/0-9 no spaces]",
            pattern: /^\S+\w{4,255}\S{1,}/
        },
        "number": {
            message: "Invalid number",
            pattern: /^[0-9]*\.?[0-9]*?$/
        },
        "currency": {
            message: "Invalid currency",
            pattern: /^[0-9]*\.?[0-9]*?$/
        },
        "iso8601": {
            message: "Invalid date time",
            pattern: /^(19[0-9]{2}|[2-9][0-9]{3})-((0(1|3|5|7|8)|10|12)-(0[1-9]|1[0-9]|2[0-9]|3[0-1])|(0(4|6|9)|11)-(0[1-9]|1[0-9]|2[0-9]|30)|(02)-(0[1-9]|1[0-9]|2[0-9]))\x20(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/
        },
        "password": {
            message: "Password too weak. 6+ characters, letter & numbers.",
            pattern: /^(?=.*\d)(?=.*[a-zA-Z])(?!.*[\W_\x7B-\xFF]).{6,255}$/
        },
        "creditCard": {
            message: "Invalid credit card",
            pattern: /^((4\d{3})|(5[1-5]\d{2})|(6011))-?\d{4}-?\d{4}-?\d{4}|3[4,7]\d{13}$/
        },
        "isbn": {
            message: "Invalid ISBN",
            pattern: /^ISBN\s(?=[-0-9xX ]{13}$)(?:[0-9]+[- ]){3}[0-9]*[xX0-9]$/
        },
        "date": {
            message: "Invalid date (dd/mm/yyyy)",
            pattern: /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
        },
        "time": {
            message: "Invalid time (hh:mm)",
            pattern: /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
        },
        "datetime": {
            message: "Invalid date / time (dd/mm/yyyy hh:mm)",
            pattern: /^((((([13578])|(1[0-2]))[\-\/\s]?(([1-9])|([1-2][0-9])|(3[01])))|((([469])|(11))[\-\/\s]?(([1-9])|([1-2][0-9])|(30)))|(2[\-\/\s]?(([1-9])|([1-2][0-9]))))[\-\/\s]?\d{4})(\s((([1-9])|(1[02]))\:([0-5][0-9])((\s)|(\:([0-5][0-9])\s))([AM|PM|am|pm]{2,2})))?$/
        }
    }
});
