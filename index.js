import express, { response } from "express";
import axios from "axios";
import cheer from "cheerio";
import cors from "cors";
import cron from "node-cron";
import { connectToCluster } from "./db.js";

const app = express();
const port = 8080;
const urlHotel = "https://www.tripadvisor.ru/Hotels-g298251-Almaty-Hotels.html";

const urlTaxi =
    "https://www.numbeo.com/taxi-fare/in/Almaty?displayCurrency=KZT";

// const urlAnytime = "https://anytime.kz/rates.html";

// FETCH AND SAVE TO DB EVERY 10 MINUTES
cron.schedule("* */1 * * * *", function () {
    // "* */10 * * * *"
    // console.log("Cron schedule is working)))");

    let mongoClient;

    // Get access to mongo db cluster
    connectToCluster()
        .then(async (client) => {
            mongoClient = client;

            // Connect to DB named "travel-expense"
            const db = mongoClient.db("travel-expense");

            // Get collection in the db named "hotel"
            const hotelCollection = db.collection("hotel");
            // Get collection in the db named "transport"
            const transportCollection = db.collection("transport");

            const anytimeCollection = db.collection("anytime");
            //Parsing HOTEL
            await axios(urlHotel)
                .then(async (response) => {
                    const html = response.data;
                    const $ = cheer.load(html);
                    const array = [];
                    const sepNov = $(".page")
                        .children(".delineation")
                        .children("#MAINWRAP")
                        .children("#MAIN")
                        .children("#BODYCON")
                        .children(".bodycon_main")
                        .children(".relWrap")
                        .children("#taplc_cupid_pricing_trends_0")
                        .children("#component_5")
                        .find("div")
                        .first()
                        .children(".ui_section")
                        .children("div:nth-child(7)")
                        .children(".OPtaC")
                        .children(".cmvHE")
                        .children(".orWuf")
                        .children(".HxUSW")
                        .children("div:nth-child(2)")
                        .html();

                    const marMay = $(".page")
                        .children(".delineation")
                        .children("#MAINWRAP")
                        .children("#MAIN")
                        .children("#BODYCON")
                        .children(".bodycon_main")
                        .children(".relWrap")
                        .children("#taplc_cupid_pricing_trends_0")
                        .children("#component_5")
                        .find("div")
                        .first()
                        .children(".ui_section")
                        .children(".MqYSb")
                        .children(".OPtaC")
                        .children(".cmvHE")
                        .children(".orWuf")
                        .children(".HxUSW")
                        .children("div:nth-child(2)")
                        .html();

                    const reg = /\d+/g;
                    let result1 = sepNov.match(reg);
                    let result2 = marMay.match(reg);
                    const resultSepNov = result1[0] + result1[1];
                    const resultMarMay = result2[0] + result2[1];
                    array.push(resultSepNov, resultMarMay);

                    const hotelCount =
                        ((parseInt(resultMarMay) + parseInt(resultSepNov)) /
                            2) *
                        480; // dollar to tenge

                    console.log(hotelCount);

                    // If hotel count exist - update it. If not - create it.
                    await hotelCollection.replaceOne(
                        { dataType: "count" },
                        { count: hotelCount },
                        {
                            upsert: true,
                        }
                    );
                })
                .catch((err) => console.log(`Error in hotel part:`, err));

            //Parsing TAXI
            await axios(urlTaxi)
                .then(async (response) => {
                    const html = response.data;
                    const $ = cheer.load(html);
                    const taxi = $("body")
                        .children(".innerWidth")
                        .children(".standard_margin")
                        .first()
                        .find("tbody")
                        .children(".tr_highlighted")
                        .children("td:nth-child(2)")
                        .html();
                    // console.log(taxi);
                    const reg = /\d+/g;
                    let resultTaxi = taxi.match(reg);
                    const transportCount = parseInt(
                        resultTaxi[0] + resultTaxi[1]
                    );
                    console.log(transportCount);

                    // If transport count exist - update it. If not - create it.
                    await transportCollection.replaceOne(
                        {},
                        { count: transportCount },
                        { upsert: true }
                    );
                })
                .catch((err) => {
                    console.log("ERROR in taxi part:", err);
                });

            // PLACES TRIPADVISERY

            mongoClient.close();
        })
        .catch(() => {
            console.log("Closing connection to MongoDB Atlas cluster...");
            mongoClient.close();
        });
});

app.use(cors());

app.get("/hotel", (req, res) => {
    let mongoClient;

    // Get access to mongo db cluster
    connectToCluster()
        .then(async (client) => {
            mongoClient = client;

            // Connect to DB named "travel-expense"
            const db = client.db("travel-expense");

            // Get collection in the db named "hotel"
            const hotelCollection = db.collection("hotel");

            // Find first item in that collection
            const hotel = await hotelCollection.findOne();

            // Return it's count (count is where we saved the number of hotels)
            res.status(200).json(hotel.count);
        })
        .finally(() => mongoClient.close());
});

app.get("/transport", (req, res) => {
    let mongoClient;

    // Get access to mongo db cluster
    connectToCluster()
        .then(async (client) => {
            mongoClient = client;

            // Connect to DB named "travel-expense"
            const db = client.db("travel-expense");

            // Get collection in the db named "transport"
            const transportCollection = db.collection("transport");

            // Find first item in that collection
            const transport = await transportCollection.findOne();

            // Return it's count (count is where we saved the number of transports)
            res.status(200).json(transport.count);
        })
        .finally(() => mongoClient.close());
});

app.listen(port, () => console.log(`Server is working on PORT ${port}`));
