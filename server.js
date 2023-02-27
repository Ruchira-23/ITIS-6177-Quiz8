const express = require('express');
const app= express();
const port=3001;
const axios = require('axios');
const https = require('https');

const swaggerJsdoc= require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const cors = require('cors');

const options={
  swaggerDefinition: {
    info :{
      title: 'Personal Budget API',
      version: '1.0.0',
      description : 'Personal Budget API auto generated'
      },
    host: '134.209.112.193:3001',
    basepath: '/',
    },
    apis: ['./server.js'],
 };

const specs = swaggerJsdoc(options);

app.use('/docs',swaggerUI.serve,swaggerUI.setup(specs));
app.use(cors());

let bodyParser = require('body-parser');
let multer = require('multer');
let upload = multer();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const mariadb = require('mariadb');
const pool = mariadb.createPool({
       host: 'localhost',
       user: 'root',
       password: 'root',
       database: 'sample',
       port: 3306,
       connectionLimit: 5
});




app.get('/say', function(req,res) {

        console.log(req.query.keyword);
        https.get('https://7x52byviq7nk6h4mp6p3viwobi0fgvsl.lambda-url.us-east-2.on.aws/default/SI_Frst_Lambda?keyword='+req.query.keyword, (resp) => {
        let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
    res.write(data);
    res.end();
  });

})

});



/**
 * @swagger
 * /api/foods:
 *     get:
  *       description : Return all prices
 *       produces:
 *           - application/json
 *       responses:
 *           200:
 *               description : Returns item name and company id
 */

// to get item name and comapny id records from foods
app.get('/api/foods', async(req,res)=>{
   let conn;
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query('SELECT ITEM_NAME,COMPANY_ID FROM foods');
        conn.end();
        const jsonData = JSON.stringify(rows);
        res.send(jsonData);
    } catch (err) {
        console.log(err);
        res.send({ error: 'An error occurred while retrieving data from the database' });
    } finally {
        if (conn) return conn.end();
    }
});


/**
 * @swagger
 * /api/agent:
 *  put:
 *    description: updates or inserts agents
 *    consumes:
 *    - application/json
 *    produces:
 *    - application/json
 *    parameters:
 *    - in: body
 *      name: agentCode
 *      required: true
 *      schema:
 *        type: string
 *        $ref: "#/definitions/agentPatch"
 *    requestBody:
 *      request: true
 *      content:
 *        application/json:
 *          schema:
  *            $ref: "#definitions/agentPatch"
 *    responses:
 *      200:
 *       description: A successfull response from agents
 * definitions:
 *   agentPatch:
 *     type: object
 *     required:
 *     - agentCode
 *     - agentName
 *     - workingArea
 *     - commission
 *     - phoneNo
 *     - country
 *     properties:
 *       agentCode:
 *         type: string
 *         example: AA101
 *       agentName:
 *         type: string
 *         example: Ruchi
 *       workingArea:
 *         type: string
 *         example: MD
 *       commission:
 *         type: decimal
 *         example: 0.80
 *       phoneNo:
 *         type: string
 *         example: 12320429
 *       country:
 *         type: string
*/

app.put('/api/agent',(request,response) =>{
    pool.query(`update sample.agents set agent_name = '${request['body'].agentName}',  working_area = '${request['body'].workingArea}', commission  = '${request['body'].commission}', phone_no = '${request['body'].phoneNo}', country = '${request['body'].country}' where agent_code = '${request['body'].agentCode}'`).then(res => {
                console.log(res.affectedRows);
                if(res.affectedRows > 0)
                {
                        response.statusCode = 200;
                        response.setHeader('Content-Type','Application/json');
                        response.send("Updated Successfully");
                }
                else{
                    pool.query(`insert into sample.agents values('${request['body'].agentCode}', '${request['body'].agentName}', '${request['body'].workingArea}', '${request['body'].commission}', '${request['body'].phoneNo}', '${request['body'].country}')`).then(res1 => { if(res1.affectedRows > 0)
                        {
                            response.statusCode = 200;
                            response.setHeader('Content-Type','Application/json');
                            response.send("Record was not found, inserting in the database");
                        }
                        else{
                            response.statusCode = 201;
                            response.setHeader('Content-Type','text/plain');
                            response.send("The agent is not located in the table - Operation  unsuccessful");
                        }
                    })
                    .catch(err =>{
                        response.statusCode = 500;
                        console.error('Error executing query', err.stack);
                        response.setHeader('Content-Type','text/plain');
                        response.send('Error executing query' + err.stack.toString());
                    });
                }
              })
        .catch(err =>{
                response.statusCode = 404;
                console.error('Error executing query', err.stack);
                response.setHeader('Content-Type','text/plain');
                response.send('Error executing query' + err.stack);
        });
});
/**
 * @swagger
 * /api/company:
 *   post:
 *     summary: Update a company record for a given company name
 *     description: This API call allows you to update city for company
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: company
 *         description: The roll id of student
 *         in: formData
 *         required: true
 *         type: string
 *       - name: city
 *         description: Section value to be updated
 *         in: formData
 *         required: true
  *         type: string
 *     responses:
 *       '201':
 *         description: Item created successfully
 *       '400':
 *         description: Invalid input provided
 *       '500':
 *         description: Internal server error
 */

 app.post('/api/company',upload.array(), async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const data = req.body;
        console.log(data);
        await conn.query('update company set company_city=? WHERE company_name = ?', [data.city,data.company]);
        conn.end();
        res.send("Updated successfully");

    } catch (error) {
        console.error(error);
        res.send({ error: 'Failed to retrieve records' });
    }
});

/**
 * @swagger
 *
 * /api/agent:
 *   delete:
 *     summary: Delete an item
 *     description: Deletes the item with the specified ID
 *     tags:
 *       - Example
 *     parameters:
 *       - name: value
 *         in: formData
 *         description: The ID of the item to delete
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               input:
  *                 type: string
 *                 description: The input value to delete
 *                 required: true
 *     responses:
 *       204:
 *         description: No content
 *       404:
 *         description: Item not found
 */

app.delete('/api/agent', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const data = req.body;
        console.log(data);
        const result = await conn.query('delete FROM agents WHERE AGENT_CODE = ?', [data.value]);
        conn.end();
        if(result.affectedRows>0){
                res.send("Deletion success");
        }
        else{
                res.send({ error: 'Failed to retrieve records' });
        }

    } catch (error) {
        console.error(error);
        res.send({ error: 'Failed to retrieve records' });
    }
});

/**
 * @swagger
 * /api/agent:
 *   patch:
 *     summary: Update agent commission
 *     description: This API call allows you to update a commission to 0.70 for given agent id.
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: value
 *         in: formData
 *         type: string
 *         description: Agent id value.
 *         required: true
 *     responses:
 *       '200':
 *         description: Agent updated successfully
 *       '400':
 *         description: Invalid input provided
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 *
 */

app.patch('/api/agent',upload.array(), async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const data = req.body;
        console.log(data);
        const rows = await conn.query('update agents set commission = 0.70  WHERE agent_code = ?', [data.value]);
        conn.end();
        res.send("Success");
    } catch (error) {
        console.error(error);
        res.send({ error: 'Failed to retrieve records' });
    }
});

 /**
 * @swagger
 * /api/listofitem:
 *     get:
 *       description : Return all agents
 *       produces:
 *           - application/json
 *       responses:
 *           200:
 *               description : Returns itemname,itemcode and coname
 */

app.get('/api/listofitem', async(req,res)=>{
    let conn;
     try {
         const conn = await pool.getConnection();
         const rows = await conn.query('SELECT ITEMCODE,ITEMNAME,CONAME FROM listofitem');
         conn.end();
         const jsonData = JSON.stringify(rows);
         res.send(jsonData);
     } catch (err) {
         console.log(err);
         res.send({ error: 'An error occurred while retrieving data from the database' });
     } finally {
         if (conn) return conn.end();
     } });


app.get('/api/daysorder', async(req,res)=>{
    let conn;
     try {
         const conn = await pool.getConnection();
         const rows = await conn.query('SELECT ORD_AMOUNT, ORD_DATE,AGENT_CODE,ORD_DESCRIPTION FROM daysorder');
         conn.end();
         const jsonData = JSON.stringify(rows);
         res.send(jsonData);
     } catch (err) {
         console.log(err);
         res.send({ error: 'An error occurred while retrieving data from the database' });
     } finally {
         if (conn) return conn.end();
     }
 });


app.head('/api/records', (req, res) => {
    res.sendStatus(200);
});

app.get('/',(req,res)=>{
        res.send("hi");
});

app.listen(port, ()=>{
    console.log('Example app listening at http://localhost:${port}');
});
