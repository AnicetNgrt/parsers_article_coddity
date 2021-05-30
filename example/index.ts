type ParseResult<R> = {
    res: R, // "Traduction" trouvée par le parser
    rem: string // Reste à parser
};

type Parser<R> = (input: string) => ParseResult<R>;

class ParseError extends Error {
    constructor(public input: string, message?: string) {
        super(message);
    }
}

type Char = string; // Vive Typescript (le type char n'existe pas)

const parse_char: Parser<Char> = (input) => {
    if (input.length < 1) {
        throw new ParseError(input, "Expected a character, got nothing.");
    }
    
    return { 
        res: input[0], 
        rem: input.substr(1) 
    }
}

// const { res, rem } = parse_char("Hello");
// console.log(res, rem);

type Condition<T> = (input: T) => boolean;

const parse_char_cond = (input, cond: Condition<Char>) => {
    const { res, rem } = parse_char(input);
    if (!cond(res)) {
        throw new ParseError(input);
    }
    return { res, rem };
}

const cond_parser = <R>(parser: Parser<R>, cond: Condition<R>) => {
    return (input: string) => {
        const { res, rem } = parser(input);
        if (!cond(res)) {
            throw new ParseError(input);
        }
        return { res, rem };
    }
}

const parse_dot = cond_parser(parse_char, c => c === ".");

const { res, rem } = parse_dot(".hello");

const is_whitespace = str => str.trim() === '';
const is_alphanum = str => str.match(/^[\p{sc=Latn}\p{Nd}]+$/u);
const is_maj = str => str === str.toUpperCase();

const parse_space = cond_parser(parse_char, is_whitespace);
const parse_alphanum = cond_parser(parse_char, is_alphanum);
const parse_maj_alphanum = cond_parser(parse_alphanum, is_maj);

// try { console.log(parse_alphanum("@")); } catch (e) { console.error(e) };
// try { console.log(parse_alphanum("$")); } catch (e) { console.error(e) };
// try { console.log(parse_maj_alphanum("hello")); } catch (e) { console.error(e) };

const zero_or_more = <R>(parser: Parser<R>) => {
    return (input: string) => {
        const res_list = [];

        let next_input = input;
        while (true) {
            try {
                const { res, rem } = parser(next_input);
                res_list.push(res);
                next_input = rem;
                // Si il n'y a plus rien à parser on s'arrête
                if (next_input === '') {
                    break;
                }
            // Si ça ne marche plus on s'arrête
            } catch(ignored) {
                break;
            }
        }
        return { res: res_list, rem: next_input };
    }
}

// try {
//     console.log(zero_or_more(parse_alphanum)("hello"));
// } catch (e) {
//     console.error(e)
// };

const one_or_more = <R>(parser: Parser<R>) => {
    const zero_or_more_parser = zero_or_more(parser);
    return (input: string) => {
        const { res, rem } = parser(input);
        const { res: res_list, rem: final_rem } = zero_or_more_parser(rem);
        return { 
            res: [res, ...res_list], 
            rem: final_rem 
        };
    }
}

// try { 
//     console.log(one_or_more(parse_alphanum)("e_ello"));
// } catch (e) { 
//     console.error(e);
// };

const pair = <R1, R2>(parser1: Parser<R1>, parser2: Parser<R2>) => {
    return (input: string) => {
        const { res: res1, rem: rem1 } = parser1(input);
        const { res: res2, rem: rem2 } = parser2(rem1);
        return { res: [res1, res2], rem: rem2 }
    }
}

const map = <R1, R2>(parser: Parser<R1>, modifier: (res: R1) => R2) => {
    return (input: string) => {
        const { res, rem } = parser(input);
        return { res: modifier(res), rem }
    }
}

// N caractères alphanum, N > 0
const parser_mot = map(
    one_or_more(parse_alphanum),
    (res) => res.join('') // On recombine les lettres
);

// espace + mot
const parser_espacement_et_mot = map(
    pair(parse_space, parser_mot),
    (res) => res[1] // On rejette l'espace
);

// majuscule + K caractères alphanum, K >= 0
const parser_mot_avec_majuscule = map(
    pair(
        parse_maj_alphanum,
        zero_or_more(parse_alphanum)
    ),
    (res) => [res[0], ...res[1]].join('') 
    // On recombine la majuscule et les lettres
);

// mot avec majuscule + M mots, M >= 0
const parser_debut_phrase = map(
    pair(
        parser_mot_avec_majuscule,
        zero_or_more(parser_espacement_et_mot)
    ),
    (res: any[]) => [res[0], ...res[1]]
    // On combine le mot avec majuscule et les autres mots
);

// prise en compte du point final
const parser_phrase = map(
    pair(parser_debut_phrase, parse_dot),
    (res) => res[0] // on ne garde que les mots
);

try {
    console.log(parser_phrase("Je suis une phrase. Ensuite...")); 
} catch (e) { console.error(e) };
