import type { NextApiRequest, NextApiResponse } from 'next'
import { getTextRecordFromEns } from './ens';

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const result = await getTextRecordFromEns('randyplayerone.eth', 'email')
    console.log(result)
  res.status(200).json({ name: 'John Doe' })
}
