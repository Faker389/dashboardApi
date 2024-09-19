const cors = require('cors');
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const serviceTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
      user: 'hihub69@gmail.com',
      pass: 'icld qzpd nkjm qmqn'
  }
});
const app = express()
app.use(cors())
app.use(express.json())
app.listen(8000)
const emailConfirms = {};
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dashboard',
  });
  function generateRandomToken() {
    const buffer = crypto.randomBytes(Math.ceil(32 * 3 / 4));
    const token = buffer.toString('base64').slice(0, 32);
    return token;
  }
  app.post('/login',(req,res)=>{
    const query = 'SELECT ID,login,password,position FROM logindata where login=?';
    connection.query(query,[req.body.login], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return;
      }
     bcrypt.compare(req.body.password,results[0].password,(err,succes)=>{
      if(err){
        console.log("compare failed")
        return 
      }
      if(results[0].position==="E"){
        const query2 = "SELECT company_ID from employees where employee_ID=?"
        connection.query(query2,[results[0].ID],(err,resp)=>{
          if(succes){
            res.status(200).json({token:generateRandomToken(),user_ID:results[0].ID,position:results[0].position,company_ID:resp[0].company_ID}).end()
          }
          res.status(409).end()
        })
      }else{
        if(succes){
          res.status(200).json({token:generateRandomToken(),user_ID:results[0].ID,position:results[0].position,company_ID:null}).end()
        }
        res.status(409).end()
      }
     })
    });
  })
  function insertEmployee(data){
    var warunek=true
    var insert2 ={
      employee_ID:"",
      aboutMe:null,
      fName:null,
      lName:null,
      username:null,
      company_ID:data.company,
      email:data.email,
      number:null
    }
  var query = 'SELECT ID from logindata where login=?';
  connection.query(query,[data.login],(err,sukces)=>{
    connection.query("INSERT INTO photos VALUES(?,null,null)",[sukces[0].ID])
    insert2.employee_ID=sukces[0].ID
    var query = "INSERT INTO employees SET ?"
    connection.query(query,insert2,(err,sukces)=>{
      if(err){
        console.log(err)
      warunek=false
      }
    })
  })
  return warunek
  }
  function insertCustomer(data){
    var warunek = true
    var insert2 ={
      customer_ID:"",
      city:null,
      country:null,
      fName:null,
      lName:null,
      postCode:null,
      email:data.email,
      number:data.number,
      rating:null,
      username:null,
      aboutMe:null
    }
    const query = 'SELECT ID from logindata where login=?';
    connection.query(query,[data.login],(err,sukces)=>{
    connection.query("INSERT INTO photos VALUES(?,null,null)",[sukces[0].ID])
      insert2.customer_ID=sukces[0].ID
      var query = "INSERT INTO customers SET ?"
      connection.query(query,insert2,(err,sukces)=>{
        if(err){
          console.log(err)
          warunek=false
        }
      })
    })
    return warunek
  }
  function insert(data,pass){
    var warunek = true
    var insert1 = {
      ID:null,
      login:data.login,
      password:pass,
      position:data.position,
      authPassword:null
    }
    var query = 'INSERT INTO logindata SET ?';
    connection.query(query,insert1,(err)=>{
      if(err){
        console.log(err)
        warunek=false
      }
    });
    if(data.position=="E"){
      warunek =insertEmployee(data)
      }else{
       warunek =insertCustomer(data)
      }
      return warunek
    }
  function makeArray(arr,str){
   var tab=[]
    for(var x=0;x<arr.length;x++){
      if(str=="mail"){
        tab.push(arr[x].email)
      }else{
        tab.push(arr[x].login)
      }
    }
    return tab
  }
  function compare(result,{login,email}){
    var wyniki =[makeArray(result[0],'login'),makeArray(result[1],'mail'),makeArray(result[2],'mail')]
    if(wyniki[0].includes(login)||wyniki[1].includes(email)||wyniki[2].includes(email)){
      return true
    }
    return false
  }
app.post('/register',(req,res)=>{
    var array = []
    connection.query('SELECT login FROM logindata',(err,result1)=>{
      connection.query('SELECT email FROM customers',(err,result2)=>{
        connection.query('SELECT email FROM employees',(err,result3)=>{
          array = [result1,result2,result3]
          var warunek =compare(array,req.body)
          if(warunek===true) {
                res.status(303).json().end()
                return 0
            }
              bcrypt.hash(req.body.password,8,(err,succes)=>{
                    if(insert(req.body,succes)){
                        res.status(200).json({message:"Everything good"}).end()
                    }else{
                          res.status(303).json({message:"Error with inserting data try again"}).end()
                      }
                    })
                });
              });
            });
    });
app.post("/employeeFeedback",(req,res)=>{
  const query = "SELECT companies.name,employees.username,employees.email,employees.fName,employees.lName,companies.adres,employees.number,companies.cp_number,employees.aboutMe,photos.pfp,photos.bgp FROM employees INNER JOIN companies ON employees.company_ID=companies.ID INNER JOIN photos ON employees.employee_ID=photos.user_ID Where employee_ID=?"
  connection.query(query,[req.body.ID],(err,result)=>{
    if(err){
      console.log(err)
      res.status(409).end()
    }
    res.json(result[0]).end()
  })
})
app.post("/updateEmployeeProfil",(req,res)=>{
  const { email,arr } = req.body;
  const token = crypto.randomBytes(20).toString('hex');
  var objekt = {
    username:arr[0],
    fname:arr[1],
    lname:arr[2],
    number:arr[3],
    aboutMe:arr[4]
  }
  emailConfirms[email] = { token, confirmed: false,objekt,ID:arr[5]};
  const mailOptions = {
      from: 'hihub69@gmail.com',
      to: email,
      subject: 'Confirm Data change',
      html: `<p>Click <a href="http://localhost:8000/emailConfirmEmployee?token=${token}">here</a> to confirm your email address.</p>`
  };
  serviceTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.status(500).send('Error sending confirmation email');
      } else {
          res.send('Confirmation email sent');
      }
  });

})
app.get('/emailConfirmEmployee',(req,res)=>{
  const { token } = req.query;
  for (const email in emailConfirms) {
      if (emailConfirms[email].token === token) {
          emailConfirms[email].confirmed = true;
          const query = "Update employees set ? where employee_ID=?"
          connection.query(query,[emailConfirms[email].objekt,emailConfirms[email].ID],(err,sukces)=>{
            if(err){
              console.log(err)
              res.status(409).end()
            }
            return res.redirect('http://localhost:3000/dashboard/Employee/profile')
          })
          return;
      }
  }
  res.status(400).send('Invalid or expired token');

})
app.post("/employeesCustomersList",(req,res)=>{
  const query = "SELECT CONCAT(customers.fName, ' ', customers.lName) as personalia,photos.pfp, customers.email FROM  customers INNER JOIN services ON customers.customer_ID = services.customer_ID INNER JOIN photos ON customers.customer_ID = photos.user_ID WHERE services.ID_pracownika = ? UNION SELECT null,logindata.authPassword as authPassword,employees.email FROM logindata INNER JOIN  employees ON logindata.ID = employees.employee_ID WHERE logindata.ID = ?;"
    connection.query(query,[req.body.ID,req.body.ID],(err,result)=>{
    if(err){
      console.log(err)
      res.status(409).end()
    }
      res.json(result).end()
  })
})
app.post("/employeeProfilInfo",(req,res)=>{
  const ID = req.body.ID
  const queryHelp = "SELECT COUNT(DISTINCT services.customer_ID) as liczba FROM services WHERE services.ID_pracownika=?;"
  connection.query(queryHelp,[ID],(err,result)=>{
    if(err){
      console.log(err)
    }
    if(parseInt(result[0].liczba)===0){
      const query = "SELECT 0 as zamowienia,0 as rating,0 as klienci, employees.username,employees.aboutMe,photos.pfp,photos.bgp FROM employees INNER JOIN photos ON employees.employee_ID=photos.user_ID WHERE employees.employee_ID=?;"
      connection.query(query,[ID],(err,result)=>{
        if(err){
          console.log(err)
          return 0
        }
        res.json(result[0]).end()
      })
    }else{
      const query = "SELECT COUNT(customers.customer_ID) AS zamowienia,Round(AVG(customers.rating),1) AS rating,(SELECT COUNT(DISTINCT customer_ID) FROM services WHERE ID_pracownika = ?) as klienci,employees.username,employees.aboutMe,photos.pfp,photos.bgp FROM services LEFT JOIN customers ON services.customer_ID = customers.customer_ID LEFT JOIN employees ON employees.employee_ID = ? LEFT JOIN photos ON employees.employee_ID = photos.user_ID WHERE services.ID_pracownika =?"
      connection.query(query,[ID,ID,ID,ID],(err,result)=>{
        if(err){
          console.log(err)
          return 0
        }
        res.json(result[0]).end()
      })
    }
  })
})
app.post("/updatePhoto",(req,res)=>{
  if(req.body.photo==="pfp"){
    const query = "UPDATE photos SET pfp=? WHERE user_ID = ?"
    connection.query(query,[req.body.url,req.body.ID],(err,sukces)=>{
      if(err){
        console.log(err)
        return 0
      }
      res.sendStatus(200).end()
    })
  }else if(req.body.photo==="bg"){
    const query = "UPDATE photos SET bgp=? WHERE user_ID = ?"
    connection.query(query,[req.body.url,req.body.ID],(err,sukces)=>{
      if(err){
        console.log(err)
        return 0
      }
      res.sendStatus(200).end()
    })
  }
})
app.post("/employeeAppointments",(req,res)=>{
  const query = "SELECT services.service_ID,concat(customers.fName,' ',customers.lName) AS person,services.productName,services.problem,services.comeDate,services.status FROM customers INNER JOIN services ON customers.customer_ID=services.customer_ID WHERE services.status=? AND services.company_ID=?"
  connection.query(query,[req.body.status,req.body.ID],(err,result)=>{
    if(err){
      console.log(err)
      return 0
    }
    res.json(result).end()
  })
})
app.post("/chartInfo",(req,res)=>{
  var ID = req.body.ID
  var objekt = {
    response1:{},
    response2:{}
  }
const query1 = "SELECT COUNT(DISTINCT customers.customer_ID) AS customers, IFNULL( (SELECT SUM(price) FROM services INNER JOIN employees ON services.ID_pracownika = employees.employee_ID WHERE services.company_ID = ?), 0 ) AS income, IFNULL( ROUND(AVG(customers.rating), 1), 0 ) AS rating, IFNULL( ROUND(AVG(DATEDIFF(services.releseDate, services.comeDate)), 0), 0 ) AS days FROM services INNER JOIN customers ON services.customer_ID = customers.customer_ID INNER JOIN employees ON services.ID_pracownika = employees.employee_ID WHERE services.company_ID = ?;"
  const query2 = "SELECT MONTH(releseDate) as miesiac,SUM(price) as monthlyIncome FROM services WHERE services.company_ID=? AND MONTH(releseDate) IS NOT null GROUP BY miesiac;"
  const months = ['January', 'February', 'March', 'April', 'May',"June","July","August","September","October","November","December"];
  connection.query(query1,[ID,ID],(err,result)=>{
    if(err){
      console.log(err)
      return 0
    }
    objekt.response1=result[0]
  })
    connection.query(query2,[ID],(err,result)=>{
      if(err){
        console.log(err)
        return 0
      }
      var arrMonths=result.reduce((prev,item)=>{
        return [...prev,months[item.miesiac-1]]
      },[])
      var arrIncome = result.reduce((prev,item)=>{
        return [...prev,parseInt(item.monthlyIncome)]
      },[])
      objekt.response2={
        income:arrIncome,
        months:arrMonths
      }
      res.json(objekt).end()
    })
})
app.post("/updateAuthPass",(req,res)=>{
  const query = "update logindata set authPassword=? where ID = ?";
  connection.query(query,[req.body.pass,req.body.ID],(err,result)=>{
    if(err){
      console.log(err)
      return 0
    }
  })
})
app.post("/sendEmail",(req,res)=>{
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: req.body.from,
      pass: req.body.auth,
    },
  });

  const mailParams = {
    from:req.body.from,
    to:req.body.to,
    subject:req.body.title,
    text:req.body.message,
  };
  transporter.sendMail(mailParams, (error, info) => {
    if (error) {
      return res.status(500).send('Error przy wysyłaniu');
    }
    res.status(200).json({wiad:'Email pomyślnie wysłano maila'});
  });
})
app.post("/customerfeedback",(req,res)=>{
  const query = "SELECT customers.email,customers.username,customers.fName,customers.lName,customers.country,customers.city,customers.postCode,customers.number,customers.rating,customers.aboutMe FROM customers WHERE customers.customer_ID=?;"
  connection.query(query,[req.body.ID],(err,result)=>{
    if (err) {
      return res.status(509);
    }
    res.status(200).json(result[0]);
  })
})
app.post('/updateProfilCustomer',(req,res)=>{
  const { email,arr } = req.body;
  const token = crypto.randomBytes(20).toString('hex');
  var objekt={
    username:arr[0],
    fName:arr[1],
    lName:arr[2],
    country:arr[3],
    city:arr[4],
    postCode:arr[5],
    rating:arr[7].toString(),
    aboutMe:arr[6]
  }
  emailConfirms[email] = { token, confirmed: false,objekt,ID:arr[8]};
  const mailOptions = {
      from: 'hihub69@gmail.com',
      to: email,
      subject: 'Confirm Data change',
      html: `<p>Click <a href="http://localhost:8000/emailConfirmCustomer?token=${token}">here</a> to confirm your email address.</p>`
  };
  serviceTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.status(500).send('Error sending confirmation email');
      } else {
          res.send('Confirmation email sent');
      }
  });

})
app.get('/emailConfirmCustomer',(req,res)=>{
  
  const { token } = req.query;
  for (const email in emailConfirms) {
      if (emailConfirms[email].token === token) {
          emailConfirms[email].confirmed = true;
          const query = "Update customers set ? WHERE customer_ID=?"
          connection.query(query,[emailConfirms[email].objekt,emailConfirms[email].ID],(err,sukces)=>{
            if(err){
              console.log(err)
              res.status(409).end()
            }
            return res.redirect('http://localhost:3000/dashBoard/Customer/profile')
          })
          return;
      }
  }
  res.status(400).send('Invalid or expired token');
})
app.post("/customerProfilInfo",(req,res)=>{
  const query = "SELECT customers.username,customers.aboutMe,photos.pfp,photos.bgp,(SELECT COUNT(services.customer_ID) FROM services WHERE customers.customer_ID = services.customer_ID) as zamowienia,customers.rating FROM customers INNER JOIN photos ON customers.customer_ID = photos.user_ID WHERE customers.customer_ID = ?;"
  connection.query(query,[req.body.ID],(err,result)=>{
    if(err){
      console.log(err)
    }
    res.json(result[0]).end()
  })
})
app.post("/customerCompanyList",(req,res)=>{
  const query="SELECT ID,name,adres from companies"
  connection.query(query,[],(err,result)=>{
    if(err){
      console.log(err)
      return 0
    }
    const query = "SELECT  service_ID, productName, problem, comeDate,ID_pracownika, IFNULL(CONCAT(employees.fName, ' ', employees.lName), 'noone') as personalia, status FROM  services LEFT JOIN employees ON services.ID_pracownika = employees.employee_ID WHERE customer_ID = ?;"
    connection.query(query,[req.body.ID],(err,result2)=>{
      if(err){
        console.log(err)
        return 0
      } 
      var obj ={
        data1:result,
        data2:result2
      }
      res.json(obj).end()
    })
  })
})
app.post("/deleteApointment",(req,res)=>{
  const query = "DELETE FROM services WHERE service_ID=?"
  connection.query(query,[req.body.ID],(err,sukces)=>{
    if(err){
      console.log(err)
      res.sendStatus(509).end()
    }
    res.sendStatus(200).end()
  })
})
app.post("/makeApointment",(req,res)=>{
  var insertObjekt=[null,null,req.body.productName,req.body.problem,null,'NOW()',null,null,req.body.customer_ID,'New',req.body.companyID]
  const query ="INSERT INTO services VALUES(?)"
  const query2 = "SELECT email from customers WHERE customer_ID = ?"
  connection.query(query,[insertObjekt],(err,sukces)=>{
    if(err){
      console.log(err)
      res.sendStatus(509).end()
    }
    connection.query(query2,[req.body.customer_ID],(err,result)=>{
      const emailParams={
        from:"hihub69@gmail.com",
        to:result[0].email,
        subject:"New appointment created",
        text:`You succesfully created new apointment. Apointment item: ${req.body.productName}`
      }
      serviceTransporter.sendMail(emailParams,(err,succes)=>{
        if (err) {
          console.error(err);
          res.status(500).send('Error sending confirmation email');
      } else {
          res.json({confirm:token});
      }
      })
    })
  })
})
app.post("/takeCase",(req,res)=>{
  const query = "UPDATE services SET ID_pracownika=?, status='In service' WHERE service_ID=?"
  connection.query(query,[req.body.userID,req.body.caseID],(err,succes)=>{
    if(err){
      console.log(err)
      res.sendStatus(509).end()
    }
    res.sendStatus(200).end()
  })
})
function findEmails(arr,email){
  for(var x=0;x<arr.length;x++){
    if(arr[x].email===email){
      return true
    }
  }
  return false
}
app.post("/forgotPassword",(req,res)=>{
  const { email } = req.body;
  const query = "SELECT email FROM employees UNION SELECT email FROM customers;"
  connection.query(query,[],(err,result)=>{
    if(!findEmails(result,email)){
      res.status(500).send('Error sending confirmation email').end();
    }
  })
  const token = (Math.floor(Math.random()*888888)+100000).toString()
 
  const mailOptions = {
      from: 'hihub69@gmail.com',
      to: email,
      subject: 'Confirm ',
      html: `Copy and paste this code in password Recovery Form. ${token}`
  };
  serviceTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.status(500).send('Error sending confirmation email');
      } else {
          res.json({confirm:token});
      }
  });

})
app.post("/updatePassword",(req,res)=>{
  const {password,email} = req.body
  const query = "SELECT employees.employee_ID as ID FROM employees WHERE email = ? UNION ALL SELECT customers.customer_ID as ID FROM customers WHERE email = ?;"
  const query2 = "Update logindata SET password=? WHERE ID =?"
  connection.query(query,[email,email],(err,results)=>{
    if(err){
      console.error(error);
      res.status(500).send('Error sending confirmation email').end();
    }
    bcrypt.hash(password,8,(err,result)=>{
      if(err){
        console.error(error);
        res.status(500).send('Error sending confirmation email').end();
      }
      connection.query(query2,[result,results[0].ID],(err,succes)=>{
        if(err){
          console.error(err);
          res.status(500).send('Error sending confirmation email').end();
        }
        res.status(200).end()
      })
    })
  })
})
app.post("/customerCompanyListStatus",(req,res)=>{
  if(req.body.status==="All"){
    const query = "SELECT  service_ID, productName, problem, comeDate,ID_pracownika, IFNULL(CONCAT(employees.fName, ' ', employees.lName), 'noone') as personalia, status FROM  services LEFT JOIN employees ON services.ID_pracownika = employees.employee_ID WHERE customer_ID = ?;"
    connection.query(query,[req.body.ID],(err,result)=>{
      if(err){
        console.log(err)
        return 0
      } 
      res.json(result).end()
    })
  }else{
   const query = "SELECT  service_ID, productName, problem, comeDate,ID_pracownika, IFNULL(CONCAT(employees.fName, ' ', employees.lName), 'noone') as personalia, status FROM  services LEFT JOIN employees ON services.ID_pracownika = employees.employee_ID WHERE customer_ID = ? AND status=?;"
    connection.query(query,[req.body.ID,req.body.status],(err,result)=>{
      if(err){
        console.log(err)
        return 0
      } 
      res.json(result).end()
    })
  }
})
app.post("/sendServiceFeedback",(req,res)=>{
  const query = "Update services set price=?,releseDate=NOW(),serviceInfo=?,status='Ready' WHERE service_ID=?"
  connection.query(query,[parseInt(req.body.price),req.body.info,req.body.ID],(err,succes)=>{
    if(err){
      console.error(err);
      res.status(500).send('Error').end();
    }
    res.status(200).end()
  })
})
app.post("/getServiceFeedback",(req,res)=>{
  const query= "SELECT price,serviceInfo from services where service_ID=?"
  connection.query(query,[req.body.ID],(err,result)=>{
    if(err){
      res.status(500).send('Error').end();
    } 
    res.json(result[0]).end()
  })
})
app.post("/payService",(req,res)=>{
  console.log(req.body.ID)
  const query="Update services set status= 'Claimed' WHERE service_ID=?"
  connection.query(query,[req.body.ID],(err,succes)=>{
    if(err){
      console.error(err);
      res.status(500).send('Error').end();
    }
    res.status(200).end()
  })
})
app.get("/comapnyList",(req,res)=>{
  const query ="SELECT ID,name,adres from companies"
  connection.query(query,[],(err,result)=>{
    if(err){
      console.error(err);
      res.status(500).send('Error').end();
    }
    res.status(200).json(result).end()
  })
})