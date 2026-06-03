const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminAddWarehouse.js', 'utf8');

content = content.replace(
  'export default function AdminAddWarehouse({ setActiveTab }) {',
  'import { doc, updateDoc } from "firebase/firestore";\nexport default function AdminEditWarehouse({ setActiveTab, initialData }) {'
);

content = content.replace(
  'const [ownerDetails, setOwnerDetails] = useState({',
  `useEffect(() => {
        if (initialData) {
            setOwnerDetails({
                businessType: initialData.businessType || '',
                companyName: initialData.companyName || '',
                contactPerson: initialData.contactPerson || '',
                mobile: initialData.mobile || '',
                email: initialData.email || '',
                ownerGstPan: initialData.ownerGstPan || '',
            });
            setWarehouseDetails({
                warehouseName: initialData.warehouseName || '',
                warehouseCategory: initialData.warehouseCategory || '',
                measurementUnit: initialData.measurementUnit || 'sqft',
                totalArea: initialData.totalArea || '',
                availableArea: initialData.availableArea || '',
                totalMetricTons: initialData.totalMetricTons || '',
                availableMetricTons: initialData.availableMetricTons || '',
                clearHeight: initialData.clearHeight || '',
                numberOfDockDoors: initialData.numberOfDockDoors || '',
                containerHandling: initialData.containerHandling || '',
                typeOfConstruction: initialData.typeOfConstruction || '',
                customTypeOfConstruction: '',
                storageTypes: initialData.storageTypes || [],
                warehouseAge: initialData.warehouseAge || '',
                warehouseGstPan: initialData.warehouseGstPan || '',
                state: initialData.state || '',
                city: initialData.city || '',
                addressWithZip: initialData.addressWithZip || '',
                googleMapPin: initialData.googleMapPin || '',
            });
            setOperationsDetails({
                inboundHandling: initialData.inboundHandling || '',
                outboundHandling: initialData.outboundHandling || '',
                wmsAvailable: initialData.wmsAvailable || '',
                daysOfOperation: initialData.daysOfOperation || '',
                operationTime: initialData.operationTime || '',
                customOperationTime: '',
                securityFeatures: initialData.securityFeatures || [],
                customSecurityFeature: '',
                suitableGoods: initialData.suitableGoods || [],
                customSuitableGood: '',
                valueAddedServices: initialData.valueAddedServices || [],
                customValueAddedService: '',
            });
            setPricingDetails({
                pricingUnit: initialData.pricingUnit || '',
                customPricingUnit: '',
                storageRate: initialData.storageRate || '',
                handlingFees: initialData.handlingFees || '',
                minCommitment: initialData.minCommitment || '',
                shortTermStorage: initialData.shortTermStorage || '',
            });
            if (initialData.mobile) setOtpVerified(true);
        }
    }, [initialData]);\n\n    const [ownerDetails, setOwnerDetails] = useState({`
);

content = content.replace(
  'await addDoc(getWarehouseCollection(role, adminEmail), docData);',
  'await updateDoc(doc(db, initialData._docPath), docData);'
);

content = content.replace('frontView: frontViewURL || null,', 'frontView: frontViewURL || initialData?.photos?.frontView || null,');
content = content.replace('insideView: insideViewURL || null,', 'insideView: insideViewURL || initialData?.photos?.insideView || null,');
content = content.replace('dockArea: dockAreaURL || null,', 'dockArea: dockAreaURL || initialData?.photos?.dockArea || null,');
content = content.replace('rateCard: rateCardURL || null,', 'rateCard: rateCardURL || initialData?.photos?.rateCard || null,');

content = content.replace(/Add New Warehouse/g, 'Edit Warehouse');
content = content.replace(/List Your Warehouse/g, 'Update Your Warehouse');
content = content.replace(/Publish Warehouse/g, 'Update Warehouse');
content = content.replace(/Publish/g, 'Update');
content = content.replace(/AdminAddWarehouse/g, 'AdminEditWarehouse');

fs.writeFileSync('src/components/admin/AdminEditWarehouse.js', content);
