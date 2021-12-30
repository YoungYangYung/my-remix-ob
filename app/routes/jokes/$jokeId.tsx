import type { LoaderFunction } from "remix";
import { Link, useLoaderData } from "remix";
import type { Joke } from "@prisma/client";
import { db } from "~/utils/db.server";

type LoaderData = { joke: Joke };

export const loader: LoaderFunction = async ({params}) =>{
    const joke = await db.joke.findUnique({
        where: { id: params.jokeId }
    })

    if(!joke) throw new Error('错误')

    const data: LoaderData = { joke }
    return data;
}

export default function JokeRoute() {
    const data = useLoaderData<LoaderData>();
    return (
        <div>
        <p>Here's your hilarious joke:</p>
        <p>{data.joke.content}</p>
        <Link to="/jokes">{data.joke.name} Permalink</Link>
      </div>
    );
  }