import amqp from 'amqplib'
import mongoose from 'mongoose'
import axios from 'axios'

await mongoose.connect('mongodb://localhost:27017/customer_tes',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
)
var Schema = mongoose.Schema
var postSchema = new Schema({
    userId: Number,
    id: Number,
    title: String,
    body: String,
},
    {
        timestamps: true
    })
var commentSchema = new Schema({
    postId: Number,
    id: Number,
    name: String,
    email: String,
    body: String
})
var PostSchema = mongoose.model("posts", postSchema)
var CommentSchema = mongoose.model("comments", commentSchema)
let result;
const conn = await amqp.connect(`amqp://localhost`)
const ch = await conn.createChannel()

await ch.consume('getAll', async (msg) => {
    const getData = await axios.get('https://jsonplaceholder.typicode.com/posts')
    for (var i = 0; i < getData.data.length; i++) {
        const post = PostSchema({
            userId: getData.data[i].userId,
            id: getData.data[i].id,
            title: getData.data[i].title,
            body: getData.data[i].body
        })
        await post.save()
    }
    const result = await PostSchema.find({});
    console.log(result);
    ch.ack(msg)
})

await ch.consume('get', async (msg) => {
    const getData = await axios.get(`https://jsonplaceholder.typicode.com/posts/${msg.content.toString()}`)
    console.log(getData.data);
    ch.ack(msg)
})

await ch.consume('getComment', async (msg) => {
    const getData = await axios.get(`https://jsonplaceholder.typicode.com/posts/${msg.content.toString()}/comments`)
    for (var i = 0; i < getData.data.length; i++) {
        const comment = CommentSchema({
            postId: getData.data[i].postId,
            id: getData.data[i].id,
            name: getData.data[i].name,
            email: getData.data[i].email,
            body: getData.data[i].body
        })
        await comment.save()
    }
    const result = await CommentSchema.find({});
    console.log(result);
    ch.ack(msg)
})

await ch.consume('post', async (msg) => {
    try {
        const getData = await axios.post(`https://jsonplaceholder.typicode.com/posts`, JSON.parse(msg.content.toString()))
        const post = PostSchema({
            userId: getData.data.userId,
            id: getData.data.id,
            title: getData.data.title,
            body: getData.data.body
        })
        await post.save()
        const result = await PostSchema.find({}).sort({ createdAt: -1 });
        console.log(result[0]);
    } catch (error) {

    }
    ch.ack(msg)
})

await ch.consume('put', async (msg) => {
    try {
        const getData = await axios.put(`https://jsonplaceholder.typicode.com/posts/${JSON.parse(msg.content.toString()).id}`, JSON.parse(msg.content.toString()).msg)
        const post = PostSchema({
            userId: getData.data.userId,
            title: getData.data.title,
            body: getData.data.body
        })
        const update = await PostSchema.findOneAndUpdate({
            id: JSON.parse(msg.content.toString()).id
        },
            {
                userId: post.userId,
                title: post.title,
                body: post.body
            },
            { new: true }
        )
        console.log(update);

    } catch (error) {

    }
    ch.ack(msg)
})

await ch.consume('delete', async (msg) => {
    await axios.delete(`https://jsonplaceholder.typicode.com/posts/${msg.content.toString()}`)
    const result = await PostSchema.deleteOne({id: msg.content.toString()})
    console.log(result);
    ch.ack(msg)
})