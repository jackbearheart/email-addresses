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
    t.ok(result, "RFC 6532 (Unicode support) is enabled by default");

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
    t.equal(result[0].name, "A B C", "display name");
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
    t.ok(result, "RFC 6532 (Unicode support) is enabled by default");

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
    t.equal(result[0].name, "A B C", "display name");
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

    result = fxn({ input: "\"Françoise Lefèvre\"@example.com", rfc6532: true });
    t.ok(result, "but extended ascii is allowed starting with RFC 6532");

    t.end();
});

test("display-name semantic interpretation", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    function check(s, comment, expected) {
        t.equal(fxn(s).name, expected || "First Last", comment);
    }

    check(
        "First<foo@bar.com>",
        "single basic name is ok",
        "First");

    check(
        "First Last<foo@bar.com>",
        "no extra whitespace is ok");

    check(
        " First Last <foo@bar.com>",
        "single whitespace at beginning and end is removed");

    check(
        "First   Last<foo@bar.com>",
        "whitespace in the middle is collapsed");

    check(
        "   First    Last     <foo@bar.com>",
        "extra whitespace everywhere is collapsed");

    check(
        "   First  Middle   Last     <foo@bar.com>",
        "extra whitespace everywhere is collapsed, with more than 2 names",
        "First Middle Last");

    check(
        "\tFirst \t  Last\t<foo@bar.com>",
        "extra whitespace everywhere is collapsed with a mix of tabs and spaces");

    check(
        "\"First Last\"<foo@bar.com>",
        "surrounding quotes are not semantic");

    check(
        " \t \"First   Last\" <foo@bar.com>",
        "surrounding quotes are not semantic and whitespace is collapsed");

    check(
        " \t \"First \\\"The\t\tNickname\\\"  Last\" <foo@bar.com>",
        "surrounding quotes are not semantic, but inner quotes are, and whitespace is collapsed",
        "First \"The Nickname\" Last");

    t.end();
});

test("address semantic interpretation", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    function check(s, comment, expected) {
        t.equal(fxn(s).address, expected || "foo@bar.com", comment);
    }

    check(
        "foo@bar.com",
        "plain address is ok");

    check(
        "  foo@bar.com  ",
        "plain address with whitespace at beginning and end");

    check(
        "foo  @bar.com",
        "plain address with whitespace left of @ sign");

    check(
        "foo@  bar.com",
        "plain address with whitespace right of @ sign");

    // Technically, we should also be able to handle removing CFWS in
    // a dot-atom (or more importantly, obs-domain), but I don't think anyone cares.

    check(
        "\t  foo\t\t@ \t  bar.com \t ",
        "plain address with whitespace everywhere");

    check(
        "Bob <\t  foo\t\t@ \t  bar.com \t >",
        "angle-addr with whitespace everywhere");

    check(
        "\"foo\"@bar.com",
        "plain address with quoted-string local-part");

    check(
        "\"foo   baz\"@bar.com",
        "plain address with quoted-string local-part including spaces" +
        " (Note: This is a confusing situation for 'semantic' local-parts, and" +
        " in this case we don't return a valid address. Don't use this. Just" +
        " take the raw tokens used for the address if you always want it to be equivalent.)",
        "foo baz@bar.com");

    t.end();
});

test("unicode support", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("\"Françoise Lefèvre\"@example.com");
    t.ok(result, "extended ascii characters are allowed");

    result = fxn("杨孝宇 <xiaoyu@example.com>");
    t.ok(result, "unicode support includes chinese characters (display-name, no quoted string)");

    result = fxn("\"杨孝宇\" <xiaoyu@example.com>");
    t.ok(result, "unicode support includes chinese characters (display-name, quoted-string)");

    t.end();
});

test("rejectTLD option", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn({ input: "foo@bar.com", rejectTLD: false });
    t.ok(result, "a simple address is ok (rejectTLD false)");

    result = fxn({ input: "foo@bar.com", rejectTLD: true });
    t.ok(result, "a simple address is ok (rejectTLD true)");

    result = fxn({ input: "\"Foo Bar\" <foo@bar.com>", rejectTLD: false });
    t.ok(result, "a more complicated address is ok (rejectTLD false)");

    result = fxn({ input: "\"Foo Bar\" <foo@bar.com>", rejectTLD: true });
    t.ok(result, "a more complicated address is ok (rejectTLD true)");

    result = fxn({ input: "foo@bar", rejectTLD: false });
    t.ok(result, "an address with a TLD for its domain is allowed by rfc 5322");

    result = fxn({ input: "foo@bar", rejectTLD: true });
    t.notOk(result, "an address with a TLD for its domain is rejected when the option is set");

    result = fxn({ input: "\"Foo Bar\" <foo@bar>", rejectTLD: false });
    t.ok(result, "a more complicated address with a TLD for its domain is allowed by rfc 5322");

    result = fxn({ input: "\"Foo Bar\" <foo@bar>", rejectTLD: true });
    t.notOk(result, "a more complicated address with a TLD for its domain is rejected when the option is set");

    t.end();
});

test("dots in unquoted display-names", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("H.P. Lovecraft <foo@bar.net>");
    t.ok(result, "dots in the middle of an unquoted display-name with spaces (obs-phrase production)");

    result = fxn("Hmm Yes Info. <foo@bar.net>");
    t.ok(result, "dots to end an unquoted display-name (obs-phrase production)");

    result = fxn("bar.net <foo@bar.net>");
    t.ok(result, "dots in the middle of an unquoted display-name without spaces (obs-phrase production)");

    result = fxn({ input: "H.P. Lovecraft <foo@bar.net>", strict: true });
    t.notOk(result, "dots without using 'obsolete' productions");

    result = fxn({ input: "Hmm Yes Info. <foo@bar.net>", strict: true });
    t.notOk(result, "dots without using 'obsolete' productions");

    result = fxn({ input: "bar.net <foo@bar.net>", strict: true });
    t.notOk(result, "dots without using 'obsolete' productions");

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
