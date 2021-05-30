var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(input, message) {
        var _this = _super.call(this, message) || this;
        _this.input = input;
        return _this;
    }
    return ParseError;
}(Error));
var parse_char = function (input) {
    if (input.length < 0) {
        throw new ParseError(input, "Expected a character, got nothing.");
    }
    return {
        res: input[0],
        rem: input.substr(1)
    };
};
var parse_char_cond = function (input, cond) {
    var _a = parse_char(input), res = _a.res, rem = _a.rem;
    if (!cond(res)) {
        throw new ParseError(input);
    }
    return { res: res, rem: rem };
};
var cond_parser = function (parser, cond) {
    return function (input) {
        var _a = parser(input), res = _a.res, rem = _a.rem;
        if (!cond(res)) {
            throw new ParseError(input);
        }
        return { res: res, rem: rem };
    };
};
var parse_dot = cond_parser(parse_char, function (c) { return c === "."; });
var _a = parse_dot(".hello"), res = _a.res, rem = _a.rem;
var is_whitespace = function (str) { return str.trim() === ''; };
var is_alphanum = function (str) { return str.match(/^[\p{sc=Latn}\p{Nd}]+$/u); };
var is_maj = function (str) { return str === str.toUpperCase(); };
var parse_space = cond_parser(parse_char, is_whitespace);
var parse_alphanum = cond_parser(parse_char, is_alphanum);
var parse_maj_alphanum = cond_parser(parse_alphanum, is_maj);
// try { console.log(parse_alphanum("@")); } catch (e) { console.error(e) };
// try { console.log(parse_alphanum("$")); } catch (e) { console.error(e) };
// try { console.log(parse_maj_alphanum("hello")); } catch (e) { console.error(e) };
var zero_or_more = function (parser) {
    return function (input) {
        var res_list = [];
        var next_input = input;
        while (true) {
            try {
                var _a = parser(next_input), res_1 = _a.res, rem_1 = _a.rem;
                res_list.push(res_1);
                next_input = rem_1;
                // Si il n'y a plus rien à parser on s'arrête
                if (next_input === '') {
                    break;
                }
                // Si ça ne marche plus on s'arrête
            }
            catch (ignored) {
                break;
            }
        }
        return { res: res_list, rem: next_input };
    };
};
try {
    console.log(zero_or_more(parse_alphanum)("hello"));
}
catch (e) {
    console.error(e);
}
;
var one_or_more = function (parser) {
    var zero_or_more_parser = zero_or_more(parser);
    return function (input) {
        var _a = parser(input), res = _a.res, rem = _a.rem;
        var _b = zero_or_more_parser(rem), res_list = _b.res, final_rem = _b.rem;
        return {
            res: __spreadArrays([res], res_list),
            rem: final_rem
        };
    };
};
try {
    console.log(one_or_more(parse_alphanum)("e_ello"));
}
catch (e) {
    console.error(e);
}
;
var pair = function (parser1, parser2) {
    return function (input) {
        var _a = parser1(input), res1 = _a.res, rem1 = _a.rem;
        var _b = parser2(rem1), res2 = _b.res, rem2 = _b.rem;
        return { res: [res1, res2], rem: rem2 };
    };
};
var map = function (parser, modifier) {
    return function (input) {
        var _a = parser(input), res = _a.res, rem = _a.rem;
        return { res: modifier(res), rem: rem };
    };
};
try {
    var parser = map(pair(parse_maj_alphanum, one_or_more(parse_alphanum)), function (res) { return __spreadArrays([res[0]], res[1]).join(''); });
    console.log(parser("Hello"));
}
catch (e) {
    console.error(e);
}
;
// N caractères alphanum, N > 0
var parser_mot = map(one_or_more(parse_alphanum), function (res) { return res.join(''); } // On recombine les lettres
);
// espace + mot
var parser_espacement_et_mot = map(pair(parse_space, parser_mot), function (res) { return res[1]; } // On rejette l'espace
);
// majuscule + K caractères alphanum, K >= 0
var parser_mot_avec_majuscule = map(pair(parse_maj_alphanum, zero_or_more(parse_alphanum)), function (res) { return __spreadArrays([res[0]], res[1]).join(''); }
// On recombine la majuscule et les lettres
);
// mot avec majuscule + M mots, M >= 0
var parser_debut_phrase = map(pair(parser_mot_avec_majuscule, zero_or_more(parser_espacement_et_mot)), function (res) { return __spreadArrays([res[0]], res[1]); }
// On combine le mot avec majuscule et les autres mots
);
// prise en compte du point final
var parser_phrase = map(pair(parser_debut_phrase, parse_dot), function (res) { return res[0]; } // on ne garde que les mots
);
try {
    console.log(parser_phrase("Je suis une phrase. Ensuite..."));
}
catch (e) {
    console.error(e);
}
;
