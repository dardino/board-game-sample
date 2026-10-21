import fastifyCookie from "@fastify/cookie";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AddressInfo } from "node:net";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { WsAdapter } from "@nestjs/platform-ws";

describe("Game state WebSocket (e2e)", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.register(fastifyCookie as never, {
      parseOptions: {
        path: "/",
      },
    });
    await app.init();
    await app.listen(0, "127.0.0.1");
  });

  afterEach(async () => {
    await app.close();
  });

  it("sends the game snapshot when a client subscribes", async () => {
    const nicknames = ["socket-owner", "socket-player"];
    for (const nickname of nicknames) {
      await request(app.getHttpServer()).
        post("/me").
        send({ nickname }).
        expect(201);
    }

    const gameResponse = await request(app.getHttpServer()).
      post("/mm/game").
      send({
        nickName: nicknames[0],
        gameTitle: "WebSocket game",
      }).
      expect(201);
    const gameId = gameResponse.body as number;

    await request(app.getHttpServer()).
      post("/mm/join").
      send({ nickName: nicknames[1],
        gameId }).
      expect(201);
    await request(app.getHttpServer()).
      post("/mm/start").
      send({ nickName: nicknames[0],
        gameId }).
      expect(201);

    const { port } = app.getHttpServer().address() as AddressInfo;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const receivedState = new Promise<unknown>((resolve, reject) => {
      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({
          type: "subscribe",
          gameId,
        }));
      });
      socket.addEventListener("message", (event) => resolve(JSON.parse(String(event.data))));
      socket.addEventListener("error", reject);
    });

    try {
      await expect(receivedState).resolves.toMatchObject({
        type: "game-state",
        gameId,
        gameType: "eldorasia",
        phase: "Setup",
        turnPhase: "CharacterSelection",
        allowedActions: ["CharacterSelection"],
      });
    } finally {
      socket.close();
    }
  });
});
