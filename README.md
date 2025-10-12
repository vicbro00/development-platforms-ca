# Development-Platforms-Course-Assignment

## A project on API written with Express and TypeScript.

## Features
- User registration and login with JWT token
- Password hashing using bcrypt
- Create and view articles
- Protected routes for authenticated users
- MySQL database
- Basic validation and error handling

## Technologies
- Node and Express
- TypeScript
- MySQL
- JWT
- bcrypt
- dotenv

## Motivation
I chose the first option for this assignment because I wanted to see what it would be like to only use Back End coding, and not mix Back End with Front End. It was also nice to try out something new I haven't done before.
I feel like the development process was fairly easy, and all the modules were really helpful and I thorougly enjoyed every part of it.
What I found slightly difficult was the SQL databases and how to make them, it was a very long process I feel like.
Developing your own API I think has its perks because you get to decide all yourself what it will look like and what it would include.

## Installation and setup
- Clone the repository
git clone https://github.com/vicbro00/development-platforms-ca.git
cd development-platforms-ca

- Install dependencies
npm install

- Setup
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Passord123
DB_NAME=news
PORT=3000
JWT_SECRET=1013mc9831m

- Start
npm run dev

## API endpoints
/auth/register
/auth/login
/articles
/users

## License
This project was created as an assigment for the Noroff Online School Front End Development