declare module emailAddresses {
    function parseOneAddress(input: string | Options): ParsedAddress;
    function parseAddressList(input: string | Options): ParsedAddress[];
    interface ParsedAddress {
        parts: {
            name: ASTNode;
            address: ASTNode;
            local: ASTNode;
            domain: ASTNode;
            comments: ASTNode[];
        };
        name: string;
        address: string;
        local: string;
        domain: string;
    }

    interface ASTNode {
        name: string;
        tokens: string;
        semantic: string;
        children: ASTNode[];
    }

    interface Options {
        input: string;
        partial?: boolean;
        rejectTLD?: boolean;
        rfc6532?: boolean;
        simple?: boolean;
        strict?: boolean;
    }

    interface ParsedResult {
        ast: ASTNode;
        addresses: ParsedAddress[];
    }
}

declare function emailAddresses(opts: emailAddresses.Options): emailAddresses.ParsedResult;

declare module "email-addresses" {
    export = emailAddresses;
}
