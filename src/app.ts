import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import "dotenv/config"
import routes from './route/index.route';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', routes);
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ message: "OK" });
});


export default app