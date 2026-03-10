const fs = require('fs');

const payloadStr = `
{
    "statusCode": 200,
    "message": "Success",
    "data": [
        {
            "id": "0045563f-f3e1-475f-b125-b0262f66fc75",
            "branchId": "d974ec6f-6851-4a08-9a69-9c24507e9328",
            "customerId": "d51f2075-fb51-4764-8226-c7206f4c7699",
            "visitDate": "2026-03-08T15:49:13.369Z"
        },
        {
            "id": "ae880bf0-18b4-4943-88b9-04d3d0739bec",
            "branchId": "d974ec6f-6851-4a08-9a69-9c24507e9328",
            "customerId": "d51f2075-fb51-4764-8226-c7206f4c7699",
            "visitDate": "2026-03-07T20:10:11.015Z"
        },
        {
            "id": "6bbb5461-fedc-4b6a-a226-e606d554c2c3",
            "visitDate": "2026-03-07T19:59:36.600Z"
        }
    ]
}
`;

const data = JSON.parse(payloadStr);
console.log(data.data.map(d => d.visitDate));
