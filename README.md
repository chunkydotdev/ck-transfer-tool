## How to use

1. Go to https://www.cryptokitties.co/search
2. Open the console (press F12)
3. Write "allow pasting"
4. Paste following:

```javascript
const tokenIds = [];
const mapper = async (response) => {
    const body = await response.json();
    tokenIds.push(...body.kitties.map(kitty => kitty.id));
};
for (let i = 0; i < 1; i++) {
    const r = await fetch(`https://api.cryptokitties.co/v3/kitties?include=other&orderBy=age&orderDirection=asc&offset=${i*20}&limit=20&owner_wallet_address=0x1281a133b59788b9e3eb4f7603babe538fb60584`, {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiMHgxMjgxYTEzM2I1OTc4OGI5ZTNlYjRmNzYwM2JhYmU1MzhmYjYwNTg0In0.D5Pjd8wqpyJhqESokrrdZEA6i2mPVvHCgerHkG3o0yA",
    "if-none-match": "W/\"f474-kXsYFO5VU/etBpgG5EnGyP/47LE\"",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "Referer": "https://www.cryptokitties.co/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});
    mapper(r);
}
console.log(tokenIds.join(","))
```