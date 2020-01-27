declare module emailAddresses {
    interface DefaultParseOneOptions {
        oneResult: true;
        rfc6532: true;
        simple: true;
        startAt: 'address-list';
    }

    interface DefaultParseListOptions {
        rfc6532: true;
        simple: true;
        startAt: 'address-list';
    }

    interface DefaultParseFromOptions {
        rfc6532: true;
        simple: true;
        startAt: 'from';
    }

    interface DefaultParseSenderOptions {
        oneResult: true,
        rfc6532: true,
        simple: true,
        startAt: 'sender',
    }

    interface DefaultParseReplyToOptions {
        rfc6532: true,
        simple: true,
        startAt: 'reply-to',
    }

    function parseOneAddress(input: string): ParsedResult<DefaultParseOneOptions>;
    function parseOneAddress<O extends Options>(opts: O): ParsedResult<Override<DefaultParseOneOptions, O>>;

    function parseAddressList(input: string): ParsedResult<DefaultParseListOptions>;
    function parseAddressList<O extends Options>(opts: O): ParsedResult<Override<DefaultParseListOptions, O>>;

    function parseFrom(input: string): ParsedResult<DefaultParseFromOptions>;
    function parseFrom<O extends Options>(opts: O): ParsedResult<Override<DefaultParseFromOptions, O>>;

    function parseSender(input: string): ParsedResult<DefaultParseSenderOptions>;
    function parseSender<O extends Options>(opts: O): ParsedResult<Override<DefaultParseSenderOptions, O>>;

    function parseReplyTo(input: string): ParsedResult<DefaultParseReplyToOptions>;
    function parseReplyTo<O extends Options>(opts: O): ParsedResult<Override<DefaultParseReplyToOptions, O>>;

    interface ParsedMailbox {
        node: ASTNode;
        parts: {
            name: ASTNode;
            address: ASTNode;
            local: ASTNode;
            domain: ASTNode;
            comments: ASTNode[];
        };
        type: 'mailbox';
        name: string;
        address: string;
        local: string;
        domain: string;
    }

    interface ParsedGroup {
        node: ASTNode;
        parts: {
            name: ASTNode;
        };
        type: 'group';
        name: string;
        addresses: ParsedMailbox[];
    }

    interface ASTNode {
        name: string;
        tokens: string;
        semantic: string;
        children: ASTNode[];
    }

    interface Options {
        input: string;
        oneResult?: boolean;
        partial?: boolean;
        rejectTLD?: boolean;
        rfc6532?: boolean;
        simple?: boolean;
        startAt?: string;
        strict?: boolean;
    }

    type Override<Default, Actual> = Omit<Default, keyof Actual> & Actual;
    type HasTrueValue<Options, Key> = Key extends keyof Options ? Options[Key] extends true ? true : false : false;
    type IsSimple<Options> = HasTrueValue<Options, 'simple'>;
    type IsOneResult<Options> = HasTrueValue<Options, 'oneResult'>;

    type Address<Options> = IsSimple<Options> extends true ? Omit<ParsedMailbox, 'node'> | Omit<ParsedGroup, 'node'> : ParsedMailbox | ParsedGroup;

    /*
        simple: false, oneResult: false
        {
            ast: ASTNode;
            addresses: {
                node: ASTNode;
                name: string;
                ...
            }[];
        }

        simple: true, oneResult: false
        {
            name: string;
            ...
        }[]

        simple: false, oneResult: true
        {
            node: ASTNode;
            name: string;
            ...
        }

        simple: true, oneResult: true
        {
            name: string;
            ...
        }
    */

    type ParsedResult<Options> = IsOneResult<Options> extends true
      ? Address<Options>
      : IsSimple<Options> extends true
        ? Address<Options>[]
        : {
            ast: ASTNode;
            addresses: Address<Options>[];
        };

}

declare function emailAddresses<O extends emailAddresses.Options>(opts: O): emailAddresses.ParsedResult<O> | null;

declare module "email-addresses" {
    export = emailAddresses;
}

/* Example usage:

// Run this file with:
//  tsc test.ts && NODE_PATH="../emailaddresses/lib" node test.js
/// <reference path="../emailaddresses/lib/email-addresses.d.ts"/>
import emailAddresses = require('email-addresses');

function isParsedMailbox(mailboxOrGroup: emailAddresses.ParsedMailbox | emailAddresses.ParsedGroup): mailboxOrGroup is emailAddresses.ParsedMailbox {
    return mailboxOrGroup.type === 'mailbox';
}

var testEmail : string = "TestName (a comment) <test@example.com>";
console.log(testEmail);

var parsed = emailAddresses.parseOneAddress(testEmail);
console.log(parsed);

var a : string = parsed.parts.name.children[0].name;
console.log(a);

if (isParsedMailbox(parsed)) {
    var comment : string = parsed.parts.comments[0].tokens;
    console.log(comment);
} else {
    console.error('error, should be a ParsedMailbox');
}

//

var emailList : string = "TestName <test@example.com>, TestName2 <test2@example.com>";
console.log(emailList);

var parsedList = emailAddresses.parseAddressList(emailList);
console.log(parsedList);

var b : string = parsedList[1].parts.name.children[0].semantic;
console.log(b);

//

var parsedByModuleFxn = emailAddresses({ input: emailList, rfc6532: true });
console.log(parsedByModuleFxn.addresses[0].name);

*/
