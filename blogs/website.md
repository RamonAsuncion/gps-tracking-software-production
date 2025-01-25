# Setting up the Website

## Flask Backend

Remember to setup the virtual environment by running the `setup.sh` file. This should have installed the necessary packages for the Flask.

I would start off by setting up a simple RESTful API using Flask. I've provided below a small snippet of a Hello, {name}!

```py
from flask import Flask
from flask_restful import Api, reqparse, Resource

app = Flask(__name__)
api = Api(app)

parser = reqparse.RequestParser()
parser.add_argument('name')

class Message(Resource):
    def get(self):
        return {'message': 'Hello, World!'}

    # curl -X POST -H "Content-Type: application/json" -d '{"name":"YourName"}' http://localhost:5000/api/message
    def post(self):
        args = parser.parse_args()
        return {'message': 'Hello, {}!'.format(args['name'])}

api.add_resource(Message, '/api/message')

if __name__ == '__main__':
    app.run(debug=True)
```

## Integrating Flask API into Next.js (React Framework)

Next.js is a React framework that gives you some building blocks, such as routing, user interface, and much more. It uses [React](https://react.dev/), the JavaScript library, for building interactive user interfaces.

You can create a new project by running the following. Next.js provides a bunch of different ways to create an app so follow the [create-next-app](https://nextjs.org/docs/pages/api-reference/create-next-app) guide on their webpage.

### Setting up Next.js

Run the following command on terminal. You'll be prompted a couple of questions on how you'll like to setup your project.

```sh
$ npx create-next-app@latest
```

We'll be using TypeScript, ESLint, and Tailwind CSS. However, this is based on preference and you should decide.

## React Frontend

By installing Next.js you'll have what you need to start using React.

## Why this way?

I do know that Next.js and Flask can be used for this project that would suffice with following this guide on [Next.js Flask Start](https://vercel.com/templates/next.js/nextjs-flask-starter).

## Packages

To extend the functionality we will be using npm packages.

- React Icons
