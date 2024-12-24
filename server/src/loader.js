import SerialPortWrapper from "./SerialPortWrapper.js";

const INIT_BYTE = 0b01010101;

(async () => {
    const port = new SerialPortWrapper({baudRate: 9600, path: "COM6"});
    try {
        await port.open();
        console.log("Port open: ", port.port.isOpen);
        await port.waitFirstReadable();
        await port.writeByte(0b01010101);
        await port.write(Buffer.from([9, 5]));
        await port.flush();
        await port.close();
    }
    catch(e) {
        const list = await SerialPortWrapper.list();
        for(const x of list) {
            console.log(x.path);
        }
        throw e;
    }
})();