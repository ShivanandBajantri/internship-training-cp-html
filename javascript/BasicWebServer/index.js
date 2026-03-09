const http=require('http');

const server = http.createServer((req,res)=>{
    
    const url = req.url;
    const method = req.method;

    if(url === '/'){
        res.writeHead(200,{'Content-Type':'text/html'});
        res.write("<h1>Home Page</h1>");
        res.end();
    } else if (url === '/about'){
        res.writeHead(200,{'Content-Type':'text/html'});
        res.write("<h1>About Page</h1>");
        res.end();
    } else if (url === '/api/users'){
        res.writeHead(200,{'Content-Type':'application/json'});
        res.write(JSON.stringify({users:['John','Jane','Bob']}));
        res.end();
    }else{
        res.writeHead(404,{'Content-Type':'text/html'});
        res.write("<h1>404 Page Not Found</h1>");
        res.end();
    }

    console.log(`Incoming URL is ${req.url}`)
    console.log(`Incoming Method is ${req.method}`)

    
});

const PORT=3000;

server.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})