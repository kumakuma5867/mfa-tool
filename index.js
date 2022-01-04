const { URL } = require("url");
const { authenticator } = require("otplib");
const QrCode = require("qrcode-reader");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const cliSelect = require("cli-select");
const glob = require("glob");
const { exit } = require("process");

const qr = new QrCode();

glob.glob(path.resolve(__dirname, "qr/*"), (err, files) => {
  if (err) {
    console.error(err);
    exit(1);
  }
  cliSelect(
    { values: files.map((f) => path.basename(f)) },
    ({ value }) => {
      if (value == null) {
        exit(0)
      }
      console.log(`\x1b[35m${value}`)
      const buffer = fs.readFileSync(path.resolve(__dirname, "qr/", value));
      Jimp.read(buffer, (err, image) => {
        if (err) {
          console.error("err");
          exit(1);
        }
        qr.callback = (err, value) => {
          if (err) {
            console.error(err);
            exit(1)
          }
          if (!value.result) {
            console.error("This is not qr of mfa.")
            exit(1)
          }
          try {
            const secret = new URL(value.result).searchParams.get("secret");
            const token = authenticator.generate(secret);
            let previous = token;
            console.log(`\x1b[32m${token}`);
            setInterval(() => {
              const token = authenticator.generate(secret);
              if (previous !== token) {
                console.log(token);
                previous = token;
              }
            }, 2000);  
          } catch (err) {
            console.error('Unexpected error happend while generating token.')
            console.error(err)
            exit(1)
          }
        };
        qr.decode(image.bitmap);
      });
    }
  );
});
