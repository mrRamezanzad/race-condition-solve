import express from "express";
import path from "path";
import {read, write} from "./lib/store";

const app = express();
const port = 3000;

async function increment() {
    const value = await read();
    const newValue = value + 1;
    return await write(newValue);
}

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/public/index.html"));
});

let lock = Promise.resolve();

app.post("/increment", async function (req, res, next) {
    const prev = lock;
    let release!: () => void;

    // lock the current request and await for previous request to finish
    lock = new Promise<void>(resolve => (release = resolve));
    await prev;

    increment()
        .then((result) => {
            res.json({result});
        })
        .catch((error) => {
            next(error);
        }).finally(() => {
        release();
    });
});

app.listen(port, () => {
    console.log(`Sandbox listening on http://localhost:${port}`);
});
