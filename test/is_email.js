const fs = require("fs")
const test = require("tap").test

const addrs = require("../lib/email-addresses");

const TESTS_FILE = "./test/tests.json"

const ISEMAIL_ERR = "ISEMAIL_ERR"
const ISEMAIL_ERR_DOMAINHYPHENSTART = "ISEMAIL_ERR_DOMAINHYPHENSTART"
const ISEMAIL_ERR_DOMAINHYPHENEND = "ISEMAIL_ERR_DOMAINHYPHENEND"

test("isemail tests", function (t) {

    for (const c of require('./tests.json')) {

        const result = addrs(convertAddress(c.address))
        let ast = result !== null ? result.addresses[0].node : null

        var isValid = ast !== null
        const expectedToBeValid = shouldParse(c.diagnosis)

        const msg = `[test ${c.id}] address: ${c.address}, expects: ${expectedToBeValid}`
        t.equal(isValid, expectedToBeValid, msg);
    }

    t.end();
})

function shouldParse(diagnosis) {
    const isOk = !startsWith(diagnosis, ISEMAIL_ERR) ||
        // is_email considers address with a domain beginning
        // or ending with "-" to be incorrect because they are not
        // valid domains, but we are only concerned with rfc5322.
        // From rfc5322's perspective, this is OK.
        diagnosis === ISEMAIL_ERR_DOMAINHYPHENSTART ||
        diagnosis === ISEMAIL_ERR_DOMAINHYPHENEND;
    return isOk;
}

// the is_email tests encode control characters
// in the U+2400 block for display purposes
function convertAddress(s) {
    var chars = [];
    for (var i = 0; i < s.length; i += 1) {
        var code = s.charCodeAt(i);
        if (code >= 0x2400) {
            code -= 0x2400;
        }
        chars.push(String.fromCharCode(code));
    }
    return chars.join('');
}

function startsWith(s, t) {
    return s.substring(0, t.length) === t;
}