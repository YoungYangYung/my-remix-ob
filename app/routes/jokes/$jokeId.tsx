import type { LoaderFunction } from "remix";
import {
  useLoaderData,
  useParams,
  useCatch,
  ActionFunction,
  redirect,
  useTransition
} from "remix";
import type { Joke } from "@prisma/client";
import { db } from "~/utils/db.server";
import { requireUserId, getUserId } from "~/utils/session.server";
import { JokeDisplay } from '~/components/joke';

type LoaderData = { joke: Joke; isOwner: boolean };

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) throw new Response("没有笑话", { status: 404 });

  const data: LoaderData = { joke, isOwner: userId === joke.jokesterId };
  return data;
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get("_method") === "delete") {
    const userId = await requireUserId(request);
    const joke = await db.joke.findUnique({
      where: { id: params.jokeId },
    });
    if (!joke) {
      throw new Response("没有可以删除的笑话", { status: 401 });
    }
    if (joke.jokesterId !== userId) {
      throw new Response("不是你的笑话", { status: 401 });
    }

    await db.joke.delete({ where: { id: params.jokeId } });
    return redirect("/jokes");
  }
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  const transition = useTransition();
  console.log('===transition',transition)
  return (
    <JokeDisplay joke={data.joke} isOwner={data.isOwner} canDelete={transition.state ==='idle'} />
  );
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 404: {
      return (
        <div className="error-container">
          {caught.data}
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.jokeId} is not your joke.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}
