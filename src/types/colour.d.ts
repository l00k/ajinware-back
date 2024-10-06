declare const colour : {
    mode : string,
    headless : boolean,
    color : (str : string) => string,
    themes : (args : any) => void,
    addSequencer : (args : any) => void,
    install : (args : any) => void,
    setTheme : (args : any) => void,
    uninstall : (args : any) => void,
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export = colour;

declare global
{
    interface String
    {
        italic : string,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        bold : string,
        underline : string,
        inverse : string,
        strikethrough : string,
        white : string,
        grey : string,
        black : string,
        blue : string,
        cyan : string,
        green : string,
        magenta : string,
        red : string,
        yellow : string,
    }
}
