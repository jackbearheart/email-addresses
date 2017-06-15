declare module "email-addresses" {
    export function parseOneAddress(opts: string): ParsedEmailOutput;
    export function parseAddressList(opts: string): ParsedEmailOutput[];
    export interface ParsedEmailOutput { 
        parts: { 
            name: {
                tokens: string;
                semantic: string;
            };
            address: {
                tokens: string;
                semantic:string;
            };
            local: {
                tokens: string;
                semantic:string;
            };
            domain: {
                tokens: string;
                semantic:string;
            };
        };
        name: string;
        address: string;
        local: string;
        domain: string;
    }
}
