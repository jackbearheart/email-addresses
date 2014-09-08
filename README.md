email-addresses.js
==================

An RFC 5322 email address parser.

v 1.1.1

What?
-----
Want to see if something could be an email address? Want to grab the display name or just the address out of a string? Put your regexes down and use this parser!

This library does not validate email addresses - we can't really do that without sending an email. However, it attempts to parse addresses using the (fairly liberal) grammar specified in RFC 5322. You can use this to check if user input looks like an email address.

Why use this?
-------------
Use this library because you can be sure it really respects the RFC:
 - The functions in the recursive decent parser match up with the productions in the RFC
 - The productions from the RFC are written above each function for easy verification
 - Tests include all of the test cases from the [is_email](https://github.com/dominicsayers/isemail) project, which are extensive

Installation
------------
npm install email-addresses

Example
-------

```
$ node
> addrs = require("email-addresses")
{ [Function: parse5322]
  parseOneAddress: [Function: parseOneAddressSimple],
  parseAddressList: [Function: parseAddressListSimple] }
> addrs.parseOneAddress('"Jack Bowman" <jack@fogcreek.com>')
{ parts:
   { name: [Object],
     address: [Object],
     local: [Object],
     domain: [Object] },
  name: '"Jack Bowman"',
  address: 'jack@fogcreek.com',
  local: 'jack',
  domain: 'fogcreek.com' }
> addrs.parseAddressList('jack@fogcreek.com, Bob <bob@example.com>')
[ { parts:
     { name: null,
       address: [Object],
       local: [Object],
       domain: [Object] },
    name: null,
    address: 'jack@fogcreek.com',
    local: 'jack',
    domain: 'fogcreek.com' },
  { parts:
     { name: [Object],
       address: [Object],
       local: [Object],
       domain: [Object] },
    name: 'Bob',
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
       parts: [Object],
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
Many thanks to [Dominic Sayers](https://github.com/dominicsayers) and his documentation and tests
for the [is_email](https://github.com/dominicsayers/isemail) function which helped greatly in writing this parser.

License
-------
Licensed under the MIT License. See the LICENSE file.
