import { successResponse, wrap, IResponse } from "./utils/shared";
import fetch from "node-fetch"

const handler = async (
    _event: AWSLambda.APIGatewayEvent
): Promise<IResponse> => {
    let offset;
    let allRecords = [] as any[];
    do {
        const data:any = await fetch(`https://api.airtable.com/v0/appGpVsrkpqsZ9qHH/Raises${offset ? `?offset=${offset}` : ''}`, {
            headers: {
                "Authorization": process.env.AIRTABLE_API_KEY!
            }
        }).then(r => r.json())
        offset = data.offset;
        allRecords = allRecords.concat(data.records)
    } while (offset !== undefined)

    const formattedRaises = allRecords.filter(r =>
        r.fields['Company name (pls match names in defillama)'] !== undefined &&
        r.fields["Source (twitter/news links better because blogposts go down quite often)"] !== undefined &&
        r.fields["Date (DD/MM/YYYY, the correct way)"] !== undefined
    ).map(r => ({
        date: new Date(r.fields["Date (DD/MM/YYYY, the correct way)"]).getTime() / 1000,
        name: r.fields["Company name (pls match names in defillama)"],
        round: r.fields["Round"] ?? null,
        amount: r.fields["Amount raised (millions)"] ?? null,
        chains: r.fields["Chain"] ?? [],
        sector: r.fields["Description (very smol)"] ?? null,
        source: r.fields["Source (twitter/news links better because blogposts go down quite often)"],
        leadInvestors: r.fields["Lead Investor"] ?? [],
        otherInvestors: r.fields["Other investors"] ?? [],
        valuation: r.fields["Valuation (millions)"] ?? null,
    }))


    return successResponse({
        raises: formattedRaises
    }, 10 * 60); // 10 mins cache
};

export default wrap(handler);