
import { SerialPort } from "serialport";
import ResolvablePromise from "../lib/mareda-util/mareda-util/promises/ResolvablePromise.js";



class SerialPortWrapper {
    /**
     * 
     * @param  {serial.RequiredOpenOpts} options 
     */
    constructor(options) {
        /** @type {serial.OpenOpts} **/
        this.options = {...{autoOpen: false}, ...options};

        this.port = new SerialPort(this.options);

        this.openPromise = null;

        this.readableFirstPromise = new ResolvablePromise();
        /** @type {ResolvablePromise} **/
        this.readablePromise = null;
        this.wasReadableOnce = false;
        // to be used with readBytes
        this.readAvailable = false;
        /** @type {Buffer|null} **/
        this.remainingToRead = null;

        this.port.on("readable", ()=>{
            if(!this.wasReadableOnce) {
                this.readableFirstPromise.resolve();
                this.wasReadableOnce = true;
            }
            if(this.readablePromise) {
                this.readablePromise.resolve();
            }
            this.readAvailable = true;
            console.log("readAvailable = true");
        });
    }

    static async list() {
        return await SerialPort.list();
    }

    open() {
        if(!this.openPromise) {
            this.openPromise = new Promise((res, rej)=>{
                this.port.open(rej);
                this.port.on("open", res);
            });
        }
        return this.openPromise;
    }

    hasDataNow() {
        return this.readAvailable || (this.remainingToRead && this.remainingToRead.byteLength < 0);
    }

    async waitFirstReadable() {
        return await this.readableFirstPromise.get();
    }

    /**
     * 
     * @param {number} desiredSize 
     */
    async readBytes(desiredSize = 1) {
        if(desiredSize < 1) {
            return null;
        }
        while(true) {
            if(this.remainingToRead && this.remainingToRead.byteLength >= desiredSize) {
                if(this.remainingToRead.byteLength == desiredSize) {
                    const ret = this.remainingToRead;
                    this.remainingToRead = null;
                    return ret;
                }
                else {
                    const ret = this.remainingToRead.subarray(0, desiredSize);
                    this.remainingToRead = this.remainingToRead.subarray(desiredSize);
                    return ret;
                }
            }
            if(!this.readAvailable) {
                this.readablePromise = new ResolvablePromise();
                await this.readablePromise.get();
            }
            /** @type {Buffer|null} **/
            const data = this.port.read();
            if(data) {
                if(this.remainingToRead) {
                    this.remainingToRead = Buffer.concat([this.remainingToRead, data]);
                }
                else if(data.byteLength >= desiredSize) {
                    const ret = data.subarray(0, desiredSize);
                    if(data.byteLength > desiredSize) {
                        this.remainingToRead = data.subarray(desiredSize);
                    }
                    else {
                        this.readAvailable = false;
                    }
                    return ret;
                }
                else {
                    this.remainingToRead = data;
                }
            }
            else {
                this.readAvailable = false;
                console.log("readAvailable = false");
            }
        }
    }

    async readByte() {
        const b = await this.readBytes(1);
        return b[0];
    }

    /**
     * 
     * @param {number} byte 
     * @returns {Promise<void>}
     */
    writeByte(byte) {
        return new Promise((res, rej)=>{
            this.port.write([byte], null, (err)=>{
                if(err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<void>}
     */
    writeText(text) {
        return new Promise((res, rej)=>{
            this.port.write(text, null, (err)=>{
                if(err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }
    /**
     * 
     * @param {Buffer} buf 
     * @returns {Promise<void>}
     */
    write(buf) {
        return new Promise((res, rej)=>{
            this.port.write(buf, null, (err)=>{
                if(err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }

    flush() {
        return new Promise((res, rej)=>{
            this.port.flush((err)=>{
                if(err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }

    close() {
        return new Promise((res, rej)=>{
            this.port.close((err)=>{
                if(err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        }); 
    }
};

export default SerialPortWrapper;