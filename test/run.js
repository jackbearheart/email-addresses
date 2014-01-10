var fs = require("fs"),
    libxmljs = require("libxmljs"),
    test = require("tap").test;

var addrs = require("../lib/email-addresses");

var TESTS_FILE = "tests.xml",
    TESTS_FILE_ENCODING = "utf8";

var ISEMAIL_ERR = "ISEMAIL_ERR",
    ISEMAIL_ERR_DOMAINHYPHENSTART = "ISEMAIL_ERR_DOMAINHYPHENSTART",
    ISEMAIL_ERR_DOMAINHYPHENEND = "ISEMAIL_ERR_DOMAINHYPHENEND";

test("simple one address function", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("ABC < a@b.c>") || {};
    t.notOk(result.node, "has no ast information");
    t.equal(result.address, "a@b.c", "full address, semantic only");
    t.equal(result.name, "ABC", "display name");
    t.equal(result.local, "a", "local part");
    t.equal(result.domain, "b.c", "domain");

    t.equal(fxn("bogus"), null, "bogus address > null");
    t.equal(fxn("a@b.c, d@e.f"), null, "address list > null");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    t.ok(result, "extended ascii is enabled by default");

    result = fxn("First Last <first@last.com>");
    t.equal(result.name, "First Last",
        "whitespace is not removed from display names without quotes");

    result = fxn("  First   Last   <first@last.com>");
    t.equal(result.name, "First Last",
        "whitespace in names is collapsed");

    t.end();
});

test("simple address list function", function (t) {
    var fxn, result;
    fxn = addrs.parseAddressList;

    result = fxn("\"A B C\" < a@b.c>, d@e") || [{}, {}];
    t.notOk(result[0].node, "has no ast information");
    t.equal(result[0].address, "a@b.c", "full address, semantic only");
    t.equal(result[0].name, "\"A B C\"", "display name");
    t.equal(result[0].local, "a", "local part");
    t.equal(result[0].domain, "b.c", "domain");

    t.notOk(result[1].node, "has no ast information");
    t.equal(result[1].address, "d@e", "second address");
    t.equal(result[1].name, null, "second display name");
    t.equal(result[1].local, "d", "second local part");
    t.equal(result[1].domain, "e", "second domain");

    t.equal(fxn("bogus"), null, "bogus address > null");
    t.equal(fxn("a@b.c").length, 1, "single address > ok");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    t.ok(result, "extended ascii is enabled by default");

    t.end();
});

test("rfc5322 parser", function (t) {
    var fxn, result;
    fxn = addrs;

    result = fxn("\"A B C\" < a@b.c>, d@e") || {};
    t.ok(result.ast, "has an ast");
    t.ok(result.addresses.length, "has the addresses");

    result = result.addresses;
    t.ok(result[0].node, "has link to node in ast");
    t.equal(result[0].address, "a@b.c", "full address, semantic only");
    t.equal(result[0].name, "\"A B C\"", "display name");
    t.equal(result[0].local, "a", "local part");
    t.equal(result[0].domain, "b.c", "domain");

    t.ok(result[1].node, "has link to node in ast");
    t.equal(result[1].address, "d@e", "second address");
    t.equal(result[1].name, null, "second display name");
    t.equal(result[1].local, "d", "second local part");
    t.equal(result[1].domain, "e", "second domain");

    t.equal(fxn("bogus"), null, "bogus address > null");
    t.equal(fxn("a@b bogus"), null, "not all input is an email list > null");

    result = fxn({ input: "a@b bogus", partial: true });
    t.ok(result, "can obtain partial results if at beginning of string");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    t.notOk(result, "extended ascii characters are invalid according to RFC 5322");

    result = fxn({ input: "\"Françoise Lefèvre\"@example.com", extendedASCII: true });
    t.ok(result, "extended ascii support can be turned on");

    t.end();
});

function isEmailTest(t, data) {
    var nodes = getNodes(data, "//test");
    nodes.forEach(function (node) {
        var id = getAttr(node, "id"),
            address = getChildValue(node, "address"),
            diagnosis = getChildValue(node, "diagnosis");

        var result = addrs(convertAddress(address)),
            ast = null;
        if (result !== null) {
            ast = result.addresses[0].node;
        }

        var isValid = ast !== null,
            expectedToBeValid = shouldParse(diagnosis);

        t.equal(isValid, expectedToBeValid,
            "[test " + id + "] address: " + address + ", expects: " + expectedToBeValid);
    });
    t.end();
}

function shouldParse(diagnosis) {
    var isOk = !startsWith(diagnosis, ISEMAIL_ERR) ||
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

function getChildValue(parent, nodeName) {
    return parent.find(nodeName)[0].text();
}

function getAttr(node, attrName) {
    return node.attr(attrName).value();
}

function getNodes(xml, xpath) {
    var doc = libxmljs.parseXml(xml);
    return doc.find(xpath);
}

function startsWith(s, t) {
    return s.substring(0, t.length) === t;
}

test("isemail tests", function (t) {
    fs.readFile(TESTS_FILE, TESTS_FILE_ENCODING, function (err, data) {
        if (err) {
            t.end();
            return console.error(err);
        }
        isEmailTest(t, data);
    });
});
