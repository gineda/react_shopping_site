const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Product } = require('../models/Product');

//=================================
//             Product
//=================================

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, `${Date.now()}_${file.originalname}`)
    }
  })
  
  var upload = multer({ storage: storage }).single("file")

router.post('/image', (req, res) => {

    //가져온 이미지를 저장해주면 됨
    upload(req, res, err => {
        if (err) {
            return req.json({ success: false, err })
        }
        return res.json({ success: true, filePath: res.req.file.path, fileName: res.req.file.filename })
    })
    

})


router.post('/', (req, res) => {

    //받아온 데이터를 DB에 저장
 
    const product = new Product(req.body)

    product.save((err) => {
        if(err) return res.status(400).json({ success: false, err })
        return res.status(200).json({ success: true })
    })

})

router.post('/products', (req, res) => {

  //product collection에 들어있는 모든 상품 정보 가져오기

  let limit = req.body.limit ? parseInt(req.body.limit) : 20;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  let term = req.body.searchTerm


  let findArgs = {};

  for(let key in req.body.filters){
    
    if (req.body.filters[key].length >0){
      
      if(key === "price"){
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        }
      }else{
        findArgs[key] = req.body.filters[key];
      }
    }
  }
  console.log('findArgs', findArgs)



  if(term){
      Product.find(findArgs)
      .find({ $text: { $search: term }})
          .populate("writer")
          .skip(skip)
          .limit(limit)
          .exec((err, productInfo) => {
            if(err) return res.status(400).json({ success: false, err })
            return res.status(200).json({ 
                success: true, productInfo,
                postSize: productInfo.length 
            })
          })

  } else {
      Product.find(findArgs)
          .populate("writer")
          .skip(skip)
          .limit(limit)
          .exec((err, productInfo) => {
            if(err) return res.status(400).json({ success: false, err })
            return res.status(200).json({ 
                success: true, productInfo,
                postSize: productInfo.length 
            })
          })
  }

})

router.get('/products_by_id', (req, res) => {

  let type = req.query.type
  let productIds = req.query.id

  if(type === "array") {
    let ids = req.query.id.split(',')
    productIds = ids.map(item => {
      return item
    })
  }

  //productId를 이용해서 DB에서 productId와 같은 상품의 정보를 가져옴

  Product.find({ _id: { $in: productIds } })
      .populate('writer')
      .exec((err, product) => {
        if(err) return res.status(400).send(err)
        return res.status(200).send(product)
      })

})


module.exports = router;
