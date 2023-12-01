const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id =process.env.SSL_APP_ID
const store_passwd =process.env.SSL_PASSWORD
const is_live = false //true for live, false for sandbox
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cors())

app.get('/api', async(req,res)=> {
  res.send('hello word')
})
const verifyJwt = (req,res,next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).send({ error: true, massage:'unAuthorization....'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(402).send({error: true, massage:'unAuthorization!!!'})
    }
    req.decoded = decoded 
    next()
  })
  }

  // const showDate = new Date()
  // const date = showDate.toDateString()
  // const time = showDate.toLocaleTimeString()
  // const displayDate = date + '-' + time
  
const uri = `mongodb+srv://${process.env.PICKABOO_USER}:${process.env.PICKABOO_PASSWORD}@cluster0.s0tuw8w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
       const productsCollection =client.db("pickaboo").collection("products")
       const viewProductsCollection =client.db("pickaboo").collection("viewProducts")
      const favoriteProductsCollection = client.db("pickaboo").collection("favoriteProducts")
      const cartCollection = client.db("pickaboo").collection("cartProducts")
      const bookingInformationCollection = client.db("pickaboo").collection("bookingInformation")
      const UsersCollection = client.db("pickaboo").collection("users")
      const bookingCollection = client.db("pickaboo").collection("bookings")
      const reviewCollection = client.db("pickaboo").collection("reviews")
      //  jwt token 
      app.post("/jwt", async (req, res) => {
        const user = req.body 
        const token = jwt.sign(user ,process.env.JWT_TOKEN, { expiresIn: "6d" })
        res.send({token})
       })
       
      // admin verify 
      const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email
        const query = { email: email }
        const user = await UsersCollection.findOne(query)
        if (user?.method !== 'admin') {
          return res.status(401).send({ error: true, massage: "unAuthorization" })
        }
        next()
      }
      
      app.get('/products', async(req, res) => {
        const query = {}
        const result = await productsCollection.find(query).toArray()
        res.send(result)
        })
      // search products 
      app.get('/search/api', async (req, res) => {
        const searchTerm = req.query.value;
        const minPrice = parseFloat(searchTerm) * 0.9; 
        const maxPrice = parseFloat(searchTerm) * 1.1; 
        
          const results = await productsCollection.find({
            $or: [
              { tittle: { $regex: new RegExp(searchTerm, 'i') } },
              { brand: { $regex: new RegExp(searchTerm, 'i') } },
              { gender: { $regex: new RegExp(searchTerm, 'i') } },
              { color: { $regex: new RegExp(searchTerm, 'i') } },
              { category: { $regex: new RegExp(searchTerm, 'i') } },
              { subCategory: { $regex: new RegExp(searchTerm, 'i') } },
              {
                $and: [
                  { price: { $gte: minPrice } },
                  { price: { $lte: maxPrice } },
                ],
              },
            ],
          }).toArray()
          res.send(results);
      });
  
      app.get("/products/:id", async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await productsCollection.findOne(query)
        res.send(result)
      })
      //  view products
      app.delete('/viewProducts', async (req, res) => {
        const email = req.query.email 
        const query = { email: email } 
        const result = await viewProductsCollection.deleteOne(query)
        res.send(result)
      })
      app.post('/viewProducts', async (req, res) => {
        const products = req.body 
        const result = await viewProductsCollection.insertOne(products)
        res.send(result)
      })
      app.get('/viewProducts', async (req, res) => {
        const email = req.query.email
        const query ={email:email}
        const result = await viewProductsCollection.find(query).toArray()
        res.send(result)
      }) 
      // favorite products
      app.post('/favoriteProducts', async (req, res) => {
        const products = req.body 
        console.log('product', products)
        const email =products?.email
        const query = { email:email}
         
        const allProducts = await favoriteProductsCollection.find(query).toArray()
        console.log( 'all-products',allProducts)
        for (let allProduct of allProducts) {
          if (allProduct?.email === products?.email && allProduct?.productsId === products?.productsId)
          return  res.status(401).send({error:true,massage:'already add to products'})
        }
       
        const result = await favoriteProductsCollection.insertOne(products)
        res.send(result)
      })
      app.get('/favoriteProducts', async (req, res) => {
        const email =req.query.email
        const query = {email:email}
        const result = await favoriteProductsCollection.find(query).toArray()
        res.send(result)
      })
      app.get("/favoriteProducts/:id", async (req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await favoriteProductsCollection.findOne(query)
        res.send(result)
      })
      app.delete('/favoriteProducts/:id', async (req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await favoriteProductsCollection.deleteOne(query)
        res.send(result)
})

    // cart products
      app.post('/cartProducts', async (req, res) => {
        const products = req.body 
        const query = { email: products?.email }
        const allProducts = await cartCollection.find(query).toArray()
        for (let product of allProducts) {
          if (product?.email === products?.email && product?.productsId === products?.productsId) {
            return res.status(401).send({error:true,massage:'already add to products'})
          }
        }
        const result = await cartCollection.insertOne(products)
        res.send(result)
    })
      app.get('/cartProducts', async (req, res) => {
        const email = req.query.email 
        const query = {email:email}
        const result = await cartCollection.find(query).toArray()
        res.send(result)
      })
      app.delete('/cartProducts/:id', async (req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await cartCollection.deleteOne(query)
        res.send(result)
      })

      app.put('/cartProducts', async (req, res) => {
        const products = req.body 
        const filter = {email:products?.email, _id: new ObjectId(products?.id)};
        const updateDoc = {
          $set: {
            quantity: products.quantity,
            subtotal: products.subtotal,
            productSize:products.productSize
          },
        };
        const result = await cartCollection.updateMany(filter, updateDoc)
        res.send(result)
      })

      app.delete('/cartProducts', async (req, res) => {
        const email = req.query.email 
        const query = { email: email }
        const result = await cartCollection.deleteMany(query)
        res.send(result)
     })
      // booking Information 
      app.delete('/bookingInformation', async (req, res) => {
        const email = req.query.email
        const query = { email: email }
        const result = await bookingInformationCollection.deleteOne(query)
        res.send(result)
      })
      app.post('/bookingInformation', async (req, res) => {
        const information = req.body 
        const result = await bookingInformationCollection.insertOne(information)
        res.send(result)
      })

      app.get("/bookingInformation", async (req, res) => {
        const email = req.query.email 
        const query = { email: email }
        const result = await bookingInformationCollection.findOne(query)
        res.send(result)
      })
      app.put('/bookingInformation', async (req, res) => {
        const email = req.query.email 
        const filter ={email:email}
        const method = req.body 
        console.log(method,email)
        const updateDoc = {
          $set: {
            method: method.method,
            currency:method.currency
          },
        };
        const result = await bookingInformationCollection.updateMany(filter, updateDoc)
        res.send(result)
      })



      // user

      app.post('/users', async (req, res) => {
        const userInfo = req.body 
        const filter = { email: userInfo?.email }
        const oldUser = await UsersCollection.findOne(filter)
        if (oldUser) {
          return
        }
        const result = await UsersCollection.insertOne(userInfo)
        res.send(result)
      })

      app.get('/users', verifyJwt,verifyAdmin, async (req, res) => {
        const query = {}
        const result = await UsersCollection.find(query).toArray()
        res.send(result)
      })
      app.patch('/users/method/:id', async (req, res) => {
        const id = req.params.id 
        const method = req.body 
        const options = { upsert: true }
        const query = {_id: new ObjectId(id) }
        const updateDoc = {
          $set: {
             method:method.admin
          },
        };
        const result = await UsersCollection.updateOne(query, updateDoc, options)
        res.send(result)
      })
        //  admin
      app.get('/users/admin', async (req, res) => {
        const email = req.query.email 
        const query = { email: email }
        const user = await UsersCollection.findOne(query)
        const result = { admin: user?.method }
        res.send(result)
      })
      app.delete('/users/:id', async(req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await UsersCollection.deleteOne(query)
        res.send(result) 
      })

      // bookings 
      app.post('/bookings', async (req, res) => {
        const bookings = req.body
        const { products, totalPrice, bookingInformation ,currency} = bookings
        const { firstName, email, country, city, thana, postCode, number } = bookingInformation 
        if (!products || !totalPrice || !bookingInformation || !currency) {
          return res.redirect('https://pickaboo-ee19c.web.app/payment/fail')
        }
        else if (!firstName || !email || !country || !city || !thana || !postCode || !number) {
          return res.redirect('https://pickaboo-ee19c.web.app/payment/fail')
        }
        const transitionId =new ObjectId().toString()
        const data = {
          total_amount:totalPrice,
          currency:currency,
          tran_id:transitionId,
          success_url: `https://pickaboo-ee19c.web.app/payment/success?transitionId=${transitionId}`,
          fail_url: `https://pickaboo-ee19c.web.app/payment/fail?transitionId=${transitionId}`,
          cancel_url: `https://pickaboo-ee19c.web.app/payment/fail?transitionId=${transitionId}`,
          ipn_url: `https://pickaboo-ee19c.web.app/payment/fail?transitionId=${transitionId}`,
          shipping_method: 'Courier',
          product_name: 'Computer.',
          product_category: 'Electronic',
          product_profile: 'general',
          cus_name:firstName,
          cus_email:email,
          cus_add1:country,
          cus_add2:country,
          cus_city:city,
          cus_state:thana,
          cus_postcode:postCode,
          cus_country:country,
          cus_phone:number,
          cus_fax: '01711111111',
          ship_name:firstName,
          ship_add1:country ,
          ship_add2:country,
          ship_city:city,
          ship_state:thana,
          ship_postcode:postCode,
          ship_country:country,
        };
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
        sslcz.init(data).then(apiResponse => {
           let GatewayPageURL = apiResponse.GatewayPageURL
          bookingCollection.insertOne({
            ...bookings,
            status: false,
            transitionId:transitionId
          })
            res.send({url: GatewayPageURL})
        });
      })

      app.post('/payment/success', async (req, res) => {
        const { transitionId } = req.query
        if (!transitionId) {
          return res.redirect('https://pickaboo-ee19c.web.app/payment/fail')
        }
        const options = { upsert: true }
        const updateDoc = {
          $set: {
            status: true,
          },
        }; 
        const result = await bookingCollection.updateOne({transitionId}, updateDoc, options)
        if (result.modifiedCount > 0) {
          res.redirect(`https://pickaboo-ee19c.web.app/payment/success?transitionId=${transitionId}`)
        }
  })

      
      app.post('/payment/fail', async (req, res) => {
        const { transitionId } = req.query 
        const result = await bookingCollection.deleteOne({ transitionId })
        if (result.deletedCount) {
          res.redirect('https://pickaboo-ee19c.web.app/payment/fail')
        }
      })
      
       // manege booking 
      app.get('/adminBooking', verifyJwt, verifyAdmin, async (req, res) => {
        const query = {}
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
      })

    app.delete('/adminBooking/:id', verifyJwt, verifyAdmin, async (req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
      })
      // orders 
      app.get('/userOrders', verifyJwt, async (req, res) => {
        const email = req.query.email 
        const query = { email: email }
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
      })
     
      // products manage 
      app.delete("/productsDelete/:id", verifyJwt, verifyAdmin, async (req, res) => {
        const id = req.params.id 
        const query = { _id: new ObjectId(id) }
        const result = await productsCollection.deleteOne(query)
        res.send(result)
      })


      // admin home 
      app.get('/admin-state', verifyJwt, verifyAdmin, async (req, res) => {
        const query = {}
        const totalUser = await UsersCollection.estimatedDocumentCount()
        const products = await productsCollection.estimatedDocumentCount()
        const totalReview = await reviewCollection.estimatedDocumentCount()
        const totalBooking = await bookingCollection.estimatedDocumentCount()
        const payments =await bookingCollection.find(query).toArray()
        const totalPayment = payments?.reduce((sum, currentValue) => currentValue.totalPrice + sum, 0)
        res.send({ totalBooking, totalPayment, totalUser, products, totalReview ,paymentsProducts:payments})
      })

      // addItems 
      app.post('/Products', verifyJwt, verifyAdmin, async (req, res) => {
        const products = req.body 
        console.log(products)
        const result = await productsCollection.insertOne(products)
        res.send(result)
      })

    } finally {
       
       
    }
  }
  run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})