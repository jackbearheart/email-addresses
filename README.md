email-addresses.js
==================

An RFC 5322 email address parser.

v 1.1.0

What?
-----
Want to see if something could be an email address? Want to grab the display name or just the address out of a string? Put your regexes down and use this parser!

This library does not validate email addresses - we can't really do that without sending an email. However, it attempts to parse addresses using the (fairly liberal) grammar specified in RFC 5322. You can use this to check if user input looks like an email address.

Example
-------

```
$ node
> addrs = require("email-addresses")
{ [Function: parse5322]
  parseOneAddress: [Function: parseOneAddressSimple],
  parseAddressList: [Function: parseAddressListSimple] }
> addrs.parseOneAddress('"Jack Bowman" <jack@fogcreek.com>')
{ name: '"Jack Bowman"',
  address: 'jack@fogcreek.com',
  local: 'jack',
  domain: 'fogcreek.com' }
> addrs.parseAddressList('jack@fogcreek.com, Bob <bob@example.com>')
[ { name: null,
    address: 'jack@fogcreek.com',
    local: 'jack',
    domain: 'fogcreek.com' },
  { name: 'Bob',
    address: 'bob@example.com',
    local: 'bob',
    domain: 'example.com' } ]
> addrs("jack@fogcreek.com")
{ ast:
   { name: 'address-list',
     tokens: 'jack@fogcreek.com',
     semantic: 'jack@fogcreek.com',
     children: [ [Object] ] },
  addresses:
   [ { node: [Object],
       name: null,
       address: 'jack@fogcreek.com',
       local: 'jack',
       domain: 'fogcreek.com' } ] }
> addrs("bogus")
null
```

References
----------
 - http://tools.ietf.org/html/rfc5322
 - http://code.google.com/p/isemail/

Props
-----
Many thanks to Dominic Sayers and his documentation and tests for the is_email function which helped greatly in writing this parser.

License
-------
Licensed under the MIT License. See the LICENSE file.
