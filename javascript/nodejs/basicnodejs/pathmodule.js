const path= require('path');

const filePath = path.join(__dirname,'files','example.txt');
console.log(__dirname)
console.log(filePath)

console.log(path.basename(filePath))