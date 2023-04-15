import type { NextApiRequest, NextApiResponse } from "next"
import { getAddrFromEns } from "../ens"

type Data = {
    name: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    const { ens } = req.query || ""

    const result = await getAddrFromEns(ens)
    console.log(result)
    return res.status(200).json(result)
}
