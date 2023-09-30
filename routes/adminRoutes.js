const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

const multer = require('multer')
const path = require('path')

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/avif': 'avif',
  'image/webp': 'webp'
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    if (!isValid) {
      const uploadError = new Error('Invalid image type');
      return cb(uploadError);
    }
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '_' + file.originalname;
    cb(null, fileName)
  }
})


const store = multer({ storage: storage, limits: { fileSize: 1024 * 1024 } });

// Define a route for the admin login page when accessed with /admin
router.post('/login', adminController.adminLogin);
router.post('/home',adminController.loadAdminHome)
router.get('/userslist',adminController.getUsersList)
router.put('/userblock/:id',adminController.blockUser)
router.put('/userunblock/:id',adminController.unblockUser)
router.get('/vendorslist',adminController.getVendorsList)
router.put('/vendorblock/:id',adminController.blockVendor)
router.put('/vendorunblock/:id',adminController.unblockVendor)
router.put('/userVerificationAccept/:id',adminController.acceptUser)
router.put('/userVerificationReject/:id',adminController.rejectUser)
router.put('/vendorVerificationAccept/:id',adminController.acceptVendor)
router.put('/vendorVerificationReject/:id',adminController.rejectVendor)
// router.post('/carTypeRegister',adminController.registerCarType)
// router.get('/cartypeslist',adminController.getCartypeslist)
// router.put('/carTypeblock/:id',adminController.blockCarType)
// router.put('/carTypeunblock/:id',adminController.unblockCarType)
// router.put('/carTypeEdit/:id',adminController.editCarType)
router.get('/carslist',adminController.getCarsList);
router.put('/carblock/:id',adminController.blockCar)
router.put('/carunblock/:id',adminController.unblockCar);
router.put('/carrVerificationAccept/:id',adminController.acceptCar)
router.put('/carrVerificationReject/:id',adminController.rejectCar)
router.get('/findVendorName/:id',adminController.getVendorName);
router.post('/addCarousels',store.array('carouselImages', 4),adminController.addCarousel)
router.get('/carouselslist',adminController.getCarouselList)
router.delete('/delete-carousel/:carouselId',adminController.deleteCarousel)
module.exports = router;
