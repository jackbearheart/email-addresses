email-addresses.js
==================

An RFC 5322 email address parser.

v 1.1.2

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

Usage
-----
If you want to simply check whether an address or address list parses, you'll want to call the following functions and check whether the results are null or not: ```parseOneAddress``` for a single address and ```parseAddressList``` for multiple addresses.

If you want to examine the parsed address, for example to extract a name or address, you have some options. The object returned by ```parseOneAddress``` has four helper values on it: ```name```, ```address```, ```local```, and ```domain```. See the example above to understand is actually returned. The ```name``` helper field attempts to helpfully collapse whitespace for the field, since that is what we generally expect from names. The ```address```, ```local```, and ```domain``` parts return the "semantic" values for those fields, i.e. they exclude whitespace and RFC 5322 comments. If you desire, you can also obtain the raw parsed tokens or semantic tokens for those fields. The ```parts``` value is an object referencing nodes in the AST generated. Nodes in the AST have two values of interest here, ```tokens``` and ```semantic```.

```
> a = addrs.parseOneAddress('Jack  Bowman  <jack@fogcreek.com >')
> a.parts.name.tokens
'Jack  Bowman  '
> a.parts.name.semantic
'JackBowman'
> a.name
'Jack Bowman'
> a.parts.address.tokens
'jack@fogcreek.com '
> a.parts.address.semantic
'jack@fogcreek.com'
> a.address
'jack@fogcreek.com'
```

If you need to, you can inspect the AST directly. The entire AST is returned when calling the module's function.

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
