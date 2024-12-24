namespace serial {
    interface RequiredOpenOpts {
        baudRate: number;
        path: string;
    } 
    interface OpenOpts extends RequiredOpenOpts {
        autoOpen: boolean;
    }
}