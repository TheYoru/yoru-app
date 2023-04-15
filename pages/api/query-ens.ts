import type { NextApiRequest, NextApiResponse } from 'next'
import { getAddrFromEns } from './ens';

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const result = await getAddrFromEns('randyplayerone.eth')
    console.log(result)
  res.status(200).json({ name: 'John Doe' })
}
