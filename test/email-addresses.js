
const assert = require('node:assert')
const test = require('node:test')

const addrs = require("../lib/email-addresses");


test("simple one address function", function (t) {
    let fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("ABC < a@b.c>") || {};
    assert.ok(!result.node, "has no ast information");
    assert.equal(result.address, "a@b.c", "full address, semantic only");
    assert.equal(result.name, "ABC", "display name");
    assert.equal(result.local, "a", "local part");
    assert.equal(result.domain, "b.c", "domain");

    assert.equal(fxn("bogus"), null, "bogus address > null");
    assert.equal(fxn("a@b.c, d@e.f"), null, "address list > null");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    assert.ok(result, "RFC 6532 (Unicode support) is enabled by default");
    assert.equal(result.parts.local.semantic, "Françoise Lefèvre");

    result = fxn("First Last <first@last.com>");
    assert.equal(result.name, "First Last",
        "whitespace is not removed from display names without quotes");

    result = fxn("  First   Last   <first@last.com>");
    assert.equal(result.name, "First Last",
        "whitespace in names is collapsed");
});

test("address with @ in the name", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;
    result = fxn({input: "ABC@abc (comment) < a@b.c>", atInDisplayName: true }) || {};
    assert.equal(result.name, "ABC@abc", "display name");});

test("address with comma in the display name", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;
    result = fxn({input: "ABC, abc (comment) <a@b.c>", commaInDisplayName: true }) || {};
    assert.equal(result.name, "ABC, abc", "display name");

    result = fxn({input: "ABC, abc (comment) <a@b.c>", commaInDisplayName: false }) || {};
    assert.equal(result.name, undefined);});

test("address with comments", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;
    result = fxn("ABC (comment) < a@b.c>" ) || {};
    assert.equal(result.name, "ABC", "display name");
    assert.equal(result.comments, '(comment)');});

test("simple address list function", function (t) {
    var fxn, result;
    fxn = addrs.parseAddressList;

    result = fxn("\"A B C\" < a@b.c>, d@e") || [{}, {}];
    assert.ok(!result[0].node, "has no ast information");
    assert.equal(result[0].address, "a@b.c", "full address, semantic only");
    assert.equal(result[0].name, "A B C", "display name");
    assert.equal(result[0].local, "a", "local part");
    assert.equal(result[0].domain, "b.c", "domain");

    assert.ok(!result[1].node, "has no ast information");
    assert.equal(result[1].address, "d@e", "second address");
    assert.equal(result[1].name, null, "second display name");
    assert.equal(result[1].local, "d", "second local part");
    assert.equal(result[1].domain, "e", "second domain");

    assert.equal(fxn("bogus"), null, "bogus address > null");
    assert.equal(fxn("a@b.c").length, 1, "single address > ok");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    assert.ok(result, "RFC 6532 (Unicode support) is enabled by default");
});

test("simple address list function with user-specified list separator", function (t) {
    var fxn, result;
    fxn = addrs.parseAddressList;

    result = fxn({ input: "\"A B C\" < a@b.c>; d@e", addressListSeparator: ";" }) || [{}, {}];
    assert.ok(!result[0].node, "has no ast information");
    assert.equal(result[0].address, "a@b.c", "full address, semantic only");
    assert.equal(result[0].name, "A B C", "display name");
    assert.equal(result[0].local, "a", "local part");
    assert.equal(result[0].domain, "b.c", "domain");

    assert.ok(!result[1].node, "has no ast information");
    assert.equal(result[1].address, "d@e", "second address");
    assert.equal(result[1].name, null, "second display name");
    assert.equal(result[1].local, "d", "second local part");
    assert.equal(result[1].domain, "e", "second domain");
});

test("rfc5322 parser", function (t) {
    var fxn, result;
    fxn = addrs;

    result = fxn("\"A B C\" < a@b.c>, d@e") || {};
    assert.ok(result.ast, "has an ast");
    assert.ok(result.addresses.length, "has the addresses");

    result = result.addresses;
    assert.ok(result[0].node, "has link to node in ast");
    assert.equal(result[0].address, "a@b.c", "full address, semantic only");
    assert.equal(result[0].name, "A B C", "display name");
    assert.equal(result[0].local, "a", "local part");
    assert.equal(result[0].domain, "b.c", "domain");

    assert.ok(result[1].node, "has link to node in ast");
    assert.equal(result[1].address, "d@e", "second address");
    assert.equal(result[1].name, null, "second display name");
    assert.equal(result[1].local, "d", "second local part");
    assert.equal(result[1].domain, "e", "second domain");

    assert.equal(fxn("bogus"), null, "bogus address > null");
    assert.equal(fxn("a@b bogus"), null, "not all input is an email list > null");

    result = fxn({ input: "a@b bogus", partial: true });
    assert.ok(result, "can obtain partial results if at beginning of string");

    result = fxn("\"Françoise Lefèvre\"@example.com");
    assert.ok(!result, "extended ascii characters are invalid according to RFC 5322");

    result = fxn({ input: "\"Françoise Lefèvre\"@example.com", rfc6532: true });
    assert.ok(result, "but extended ascii is allowed starting with RFC 6532");
});

test("display-name semantic interpretation", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    function check(s, comment, expected) {
        assert.equal(fxn(s).name, expected || "First Last", comment);
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
        "First \"Middle\" Last <foo@bar.com>",
        "surrounding quotes should not run words together",
        "First Middle Last");

    check(
        " \t \"First   Last\" <foo@bar.com>",
        "surrounding quotes are not semantic and whitespace is collapsed");

    check(
        " \t \"First \\\"The\t\tNickname\\\"  Last\" <foo@bar.com>",
        "surrounding quotes are not semantic, but inner quotes are, and whitespace is collapsed",
        "First \"The Nickname\" Last");
});

test("address semantic interpretation", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    function check(s, comment, expected) {
        assert.equal(fxn(s).address, expected || "foo@bar.com", comment);
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
});

test("unicode support", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("\"Françoise Lefèvre\"@example.com");
    assert.ok(result, "extended ascii characters are allowed");

    result = fxn("杨孝宇 <xiaoyu@example.com>");
    assert.ok(result, "unicode support includes chinese characters (display-name, no quoted string)");

    result = fxn("\"杨孝宇\" <xiaoyu@example.com>");
    assert.ok(result, "unicode support includes chinese characters (display-name, quoted-string)");
});

test("rejectTLD option", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn({ input: "foo@bar.com", rejectTLD: false });
    assert.ok(result, "a simple address is ok (rejectTLD false)");

    result = fxn({ input: "foo@bar.com", rejectTLD: true });
    assert.ok(result, "a simple address is ok (rejectTLD true)");

    result = fxn({ input: "\"Foo Bar\" <foo@bar.com>", rejectTLD: false });
    assert.ok(result, "a more complicated address is ok (rejectTLD false)");

    result = fxn({ input: "\"Foo Bar\" <foo@bar.com>", rejectTLD: true });
    assert.ok(result, "a more complicated address is ok (rejectTLD true)");

    result = fxn({ input: "foo@bar", rejectTLD: false });
    assert.ok(result, "an address with a TLD for its domain is allowed by rfc 5322");

    result = fxn({ input: "foo@bar", rejectTLD: true });
    assert.ok(!result, "an address with a TLD for its domain is rejected when the option is set");

    result = fxn({ input: "\"Foo Bar\" <foo@bar>", rejectTLD: false });
    assert.ok(result, "a more complicated address with a TLD for its domain is allowed by rfc 5322");

    result = fxn({ input: "\"Foo Bar\" <foo@bar>", rejectTLD: true });
    assert.ok(!result, "a more complicated address with a TLD for its domain is rejected when the option is set");

    result = fxn({ input: "jack@", rejectTLD: true });
    assert.ok(!result, "no domain is ok with rejectTLD set");
});

test("dots in unquoted display-names", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn("H.P. Lovecraft <foo@bar.net>");
    assert.ok(result, "dots in the middle of an unquoted display-name with spaces (obs-phrase production)");

    result = fxn("Hmm Yes Info. <foo@bar.net>");
    assert.ok(result, "dots to end an unquoted display-name (obs-phrase production)");

    result = fxn("bar.net <foo@bar.net>");
    assert.ok(result, "dots in the middle of an unquoted display-name without spaces (obs-phrase production)");

    result = fxn({ input: "H.P. Lovecraft <foo@bar.net>", strict: true });
    assert.ok(!result, "dots without using 'obsolete' productions");

    result = fxn({ input: "Hmm Yes Info. <foo@bar.net>", strict: true });
    assert.ok(!result, "dots without using 'obsolete' productions");

    result = fxn({ input: "bar.net <foo@bar.net>", strict: true });
    assert.ok(!result, "dots without using 'obsolete' productions");
});

test("rfc6854 - from", function (t) {
    var fxn, result;
    fxn = addrs.parseFrom;

    result = fxn("Managing Partners:ben@example.com,carol@example.com;");
    assert.ok(result, "Parse group for From:");
    assert.equal(result[0].name, "Managing Partners", "Extract group name");
    assert.equal(result[0].addresses.length, 2, "Extract group addresses");
    assert.equal(result[0].addresses[0].address, "ben@example.com", "Group address 1");
    assert.equal(result[0].addresses[1].address, "carol@example.com", "Group address 1")

    result = fxn("Managing Partners:ben@example.com,carol@example.com;, \"Foo\" <foo@example.com>");
    assert.ok(result, "Group and mailbox");
    assert.equal(result[0].name, "Managing Partners", "Extract group name");
    assert.equal(result[1].name, "Foo", "Second address name");
    assert.equal(result[1].local, "foo", "Second address local");
    assert.equal(result[1].domain, "example.com", "Second address domain");
});

test("rfc6854 - sender", function (t) {
    var fxn, result;
    fxn = addrs.parseSender;

    result = fxn("Managing Partners:ben@example.com,carol@example.com;");
    assert.ok(result, "Parse group for Sender:");
    assert.equal(result.length, undefined, "Result is not an array");
    assert.equal(result.name, "Managing Partners", "Result has name");
    assert.equal(result.local, undefined, "Result has no local part");
    assert.equal(result.addresses.length, 2, "Result has two addresses");
    assert.equal(result.addresses[0].address, "ben@example.com", "Result first address match");
    assert.equal(result.addresses[1].address, "carol@example.com", "Result first address match");
});

test("rfc6854 - reply-to", function (t) {
    var fxn, result;
    fxn = addrs.parseReplyTo;

    result = fxn("Managing Partners:ben@example.com,carol@example.com;");
    assert.ok(result, "Parse group for Reply-To:");
    assert.equal(result[0].name, "Managing Partners", "Extract group name");
    assert.equal(result[0].addresses.length, 2, "Extract group addresses");
    assert.equal(result[0].addresses[0].address, "ben@example.com", "Group address 1");
    assert.equal(result[0].addresses[1].address, "carol@example.com", "Group address 1")

    result = fxn("Managing Partners:ben@example.com,carol@example.com;, \"Foo\" <foo@example.com>");
    assert.ok(result, "Group and mailbox");
    assert.equal(result[0].name, "Managing Partners", "Extract group name");
    assert.equal(result[1].name, "Foo", "Second address name");
    assert.equal(result[1].local, "foo", "Second address local");
    assert.equal(result[1].domain, "example.com", "Second address domain");

    result = fxn("Managing Partners:ben@example.com,carol@example.com;, \"Foo\" <foo@example.com>, Group2:alice@example.com;");
    assert.ok(result, "Group, mailbox, group");
    assert.equal(result[0].name, "Managing Partners", "First: group name");
    assert.equal(result[0].addresses[0].address, "ben@example.com");
    assert.equal(result[0].addresses[1].address, "carol@example.com");
    assert.equal(result[1].name, "Foo", "Second: address name");
    assert.equal(result[2].name, "Group2", "Third: group name");
});

test("whitespace in domain", function (t) {
    var fxn, result;
    fxn = addrs.parseOneAddress;

    result = fxn('":sysmail"@ Some-Group. Some-Org');
    assert.ok(result, "spaces in domain parses ok");
    assert.equal(result.domain, "Some-Group.Some-Org", "domain parsing strips whitespace");
})
