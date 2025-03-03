// import { xtsMarketDataAPI as XtsMarketDataAPI, WS as XtsMarketDataWS } from 'xts-marketdata-api';
import axios from 'axios';

// const API_URL = 'https://developers.symphonyfintech.com/marketdata';
// const API_KEY = 'your-api-key';

const API_BASE_URL = "https://mtrade.arhamshare.com/apimarketdata";
const API_KEY = 'c2ced77ad036782ac77986';  // Replace with your actual API Key

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    }
});

export default apiClient;

async function login() {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            secretKey: API_KEY
        });
        console.log('Login Successful:', response.data);
        return response.data;
    } catch (e) {
        // console.error('Login Failed:', e.response?.data || e.message);
    }
}
login();

async function getOptionChain(symbol: string) {
    try {
        const response = await apiClient.get(`/fo/option-chain?symbol=${symbol}`);
        console.log('📊 Option Chain Data:', response.data);
    } catch (error) {
        // console.error('❌ Error fetching option chain:', error.response?.data || error.message);
    }
}

getOptionChain('NIFTY');

async function getFuturesData(symbol: string) {
    try {
        const response = await apiClient.get(`/fo/futures?symbol=${symbol}`);
        console.log('📊 Futures Data:', response.data);
    } catch (error) {
        // console.error('❌ Error fetching futures data:', error.response?.data || error.message);
    }
}

getFuturesData('RELIANCE');

async function placeOptionOrder(orderData: any) {
    try {
        const response = await apiClient.post('/fo/order', orderData);
        console.log('✅ Order Placed:', response.data);
    } catch (error) {
        // console.error('❌ Order Failed:', error.response?.data || error.message);
    }
}

placeOptionOrder({
    symbol: 'NIFTY24FEB20000CE',  // Example: NIFTY 20000 CE Expiry FEB 2024
    quantity: 50,
    orderType: 'BUY',
    price: 120.5,
    orderValidity: 'DAY'
});

async function placeFuturesOrder(orderData: any) {
    try {
        const response = await apiClient.post('/fo/order', orderData);
        console.log('✅ Futures Order Placed:', response.data);
    } catch (error) {
        // console.error('❌ Order Failed:', error.response?.data || error.message);
    }
}

placeFuturesOrder({
    symbol: 'BANKNIFTY24MARFUT',  // Example: BANKNIFTY March 2024 Futures
    quantity: 25,
    orderType: 'SELL',
    price: 45600,
    orderValidity: 'IOC'
});

async function getOrderStatus(orderId: string) {
    try {
        const response = await apiClient.get(`/fo/order/${orderId}`);
        console.log('📌 Order Status:', response.data);
    } catch (error) {
        // console.error('❌ Error fetching order status:', error.response?.data || error.message);
    }
}

getOrderStatus('1234567890'); // Replace with actual order ID

async function cancelOrder(orderId: string) {
    try {
        const response = await apiClient.delete(`/fo/order/${orderId}`);
        console.log('✅ Order Canceled:', response.data);
    } catch (error) {
        // console.error('❌ Cancel Failed:', error.response?.data || error.message);
    }
}

cancelOrder('1234567890'); // Replace with actual order ID

async function getMarketData() {

    try {
        const response = await axios.get(`${API_BASE_URL}/data`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
}

getMarketData();

const socket = new WebSocket('wss://mtrade.arhamshare.com/apimarketdata/ws');

socket.onopen = () => {
    console.log('Connected to WebSocket');
    socket.send(JSON.stringify({ action: 'subscribe', symbol: 'NIFTY' }));
};

socket.onmessage = (event) => {
    console.log('Market Data Update:', event.data);
};

socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
};



// Place an Order

// async function placeOrder(orderData: any) {
//     try {
//         const response = await apiClient.post('/orders', orderData);
//         console.log('Order Placed:', response.data);
//     } catch (error) {
//         console.error('Order Failed:', error.response?.data || error.message);
//     }
// }

// placeOrder({
//     symbol: 'NIFTY',
//     quantity: 10,
//     orderType: 'BUY',
//     price: 20000
// });


//--------------------------------------------------------------------------------------------------------------------------

// interface Config {
//     userID: string;
//     password: string;
//     publicKey: string;
//     source: string;
//     publishFormat: string;
//     broadcastMode: string;
//     url: string;
// }

// declare const config: Config;

// let { userID, password, publicKey, source, publishFormat, broadcastMode, url } = config;

// let xtsMarketDataAPI: any = null;
// let xtsMarketDataWS: any = null;

// async function testAPI() {
    // const clientConfigRequest = { source, userID };
    // await clientConfig(clientConfigRequest);

    // const searchInstrumentRequest = { searchString: "RELIENCE", source, userID };
    // await searchInstrument(searchInstrumentRequest);

    // const subscriptionRequest = {
        // userID,
        // clientID: userID,
        // source,
        // instruments: [
        //     { exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM, exchangeInstrumentID: 22 },
        //     { exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM, exchangeInstrumentID: 11536 },
        // ],
        // marketDataPort: xtsMarketDataAPI.marketDataPorts.marketDepthEvent,
    // };
    // await subscription(subscriptionRequest);

    // const unSubscriptionRequest = {
        // userID,
        // clientID: userID,
        // source,
        // instruments: [
        //     { exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM, exchangeInstrumentID: 2885 },
        //     { exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM, exchangeInstrumentID: 11536 },
        // ],
        // marketDataPort: xtsMarketDataAPI.marketDataPorts.marketDepthEvent,
//     };
//     await unSubscription(unSubscriptionRequest);
// }

// const subscription = async (subscriptionRequest: any) => {
    // let response = await xtsMarketDataAPI.subscription(subscriptionRequest);
    // console.log(response);
    // return response;
// };

// const unSubscription = async (unSubscriptionRequest: any) => {
//     let response = await xtsMarketDataAPI.unSubscription(unSubscriptionRequest);
//     console.log(response);
//     return response;
// };



// export const searchInstrument = async (searchInstrumentRequest: any) => {
//     let response = await xtsMarketDataAPI.searchInstrument(searchInstrumentRequest);
//     console.log(response);
//     return response;
// };

// const clientConfig = async (clientConfigRequest: any) => {
    // let response = await axios.clientConfig(clientConfigRequest);
    // console.log(response);
    // return response;
// };

// const logOut = async () => {
//     let response = await xtsMarketDataAPI.logOut();
//     console.log(response);
//     return response;
// };

// const registerEvents = async () => {
    // xtsMarketDataWS.onConnect((connectData: any) => console.log(connectData));
    // xtsMarketDataWS.onJoined((joinedData: any) => console.log(joinedData));
    // xtsMarketDataWS.onError((errorData: any) => console.log(errorData));
    // xtsMarketDataWS.onDisconnect((disconnectData: any) => console.log(disconnectData));
    // xtsMarketDataWS.onMarketDepthEvent((marketDepthData: any) => console.log(marketDepthData));
    // xtsMarketDataWS.onLogout((logoutData: any) => console.log(logoutData));
// };

// export const initialize = (async () => {
    // xtsMarketDataAPI = new XtsMarketDataAPI(url);
    
    // const loginRequest = { userID, password, publicKey, source };
    // let logIn = await xtsMarketDataAPI.logIn(loginRequest);

    // if (logIn && logIn.type === xtsMarketDataAPI.responseTypes.success) {
    //     // xtsMarketDataWS = new XtsMarketDataWS(url);

    //     const socketInitRequest = {
    //         userID,
    //         publishFormat,
    //         broadcastMode,
    //         token: logIn.result.token,
    //     };
    //     xtsMarketDataWS.init(socketInitRequest);

    //     await registerEvents();
    //     testAPI();
    // } else {
    //     console.error(logIn);
    // }
// }
// );