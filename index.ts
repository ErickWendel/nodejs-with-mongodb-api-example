// import * as Hapi from 'hapi';
import * as Joi from '@hapi/joi';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Hapi from '@hapi/hapi';

import { MongoClient, ObjectId } from 'mongodb';

const HapiSwagger = require('hapi-swagger');

const port = process.env.PORT || 3000;
const server = new Hapi.Server({
  port,
  routes: {
    cors: {
      origin: ['*'],
    },
  },
});

(async () => {
  const host = process.env.MONGO_URL || 'localhost';
  const connectionString = `mongodb://${host}/heroes`;
  const connection = await MongoClient.connect(connectionString, {
    useNewUrlParser: true,
  });
  console.log('mongo db is running');

  const db = connection.db('heroes').collection('hero');

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'Node.js with MongoDB Example - Erick Wendel',
          version: 'v1.0',
        },
      },
    },
  ]);

  server.route([
    {
      method: 'GET',
      path: '/',
      config: {
        handler: (r, reply) => reply.redirect('/documentation'),
      },
    },
    {
      method: 'GET',
      path: '/heroes',
      config: {
        handler: () => {
          return db.find().toArray();
        },
        description: 'List All heroes',
        notes: 'heroes from database',
        tags: ['api'],
      },
    },
    {
      method: 'POST',
      path: '/heroes',
      config: {
        handler: req => {
          const { payload } = req;
          return db.insert(payload);
        },
        description: 'Create a hero',
        notes: 'create a hero',
        tags: ['api'],
        validate: {
          payload: {
            name: Joi.string().required(),
            power: Joi.string().required(),
          },
        },
      },
    },
    {
      method: 'PUT',
      path: '/heroes/{id}',
      config: {
        handler: req => {
          const { payload } = req;
          const {
            params: { id },
          } = req;
          return db.updateOne({ _id: new ObjectId(id) }, { $set: payload });
        },
        description: 'Update a hero',
        notes: 'Update a hero',
        tags: ['api'],
        validate: {
          params: {
            id: Joi.string().required(),
          },
          payload: {
            name: Joi.string(),
            power: Joi.string(),
          },
        },
      },
    },
    {
      method: 'DELETE',
      path: '/heroes/{id}',
      config: {
        handler: req => {
          return db.deleteOne({ _id: new ObjectId(req.params.id) });
        },
        description: 'Delete a hero',
        notes: 'Delete a hero',
        tags: ['api'],
        validate: {
          params: {
            id: Joi.string().required(),
          },
        },
      },
    },
  ]);

  await server.start();
  console.log('server running at', port);
})();
