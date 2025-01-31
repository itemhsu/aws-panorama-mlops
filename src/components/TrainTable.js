/* eslint-disable react/no-multi-comp */
import Table from 'aws-northstar/components/Table';
import StatusIndicator from 'aws-northstar/components/StatusIndicator';
import Button from 'aws-northstar/components/Button';
import ButtonDropdown from 'aws-northstar/components/ButtonDropdown';
import Inline from 'aws-northstar/layouts/Inline';
import { Text } from 'aws-northstar';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux'

import { API } from 'aws-amplify';
import { withTranslation } from 'react-i18next'
import DeleteModal from './atom/DeleteModal';
import { useHistory } from 'react-router-dom';


const mapStateToProps = state => {
    return { session: state.session }
}

const MapDispatchTpProps = (dispatch) => {
    return {
        changeLang: (key) => dispatch({ type: 'change_language', data: key })
    }
}

const columnDefinitions = [
    {
        'id': 'model.model_name',
        width: 250,
        Header: 'Application Name',
        accessor: 'model_name',
        Cell: ({ row }) => {
            return <div>
                <a href={`/ModelManageTable/${row.original.model_name}`}>{row.original.model_name}</a>
            </div>
        }
    },
    {
        'id': 'stage',
        width: 150,
        Header: 'Stage',
        accessor: 'stage',
        Cell: ({ row }) => {
            if (row && row.original) {
                // console.log(row.original)
                const status = row.original.stage;
                console.log(status)
                switch (status) {
                    case 'Training':
                        return <StatusIndicator statusType="info">Training</StatusIndicator>;
                    case 'Packaging':
                        return <StatusIndicator statusType="info">Packaging</StatusIndicator>;
                    case 'Complete':
                        return <StatusIndicator statusType="positive">Completed</StatusIndicator>;
                    case 'Error':
                        return <StatusIndicator statusType="negative">Error</StatusIndicator>;
                    default:
                        return (
                                <StatusIndicator statusType="info" >Training</StatusIndicator>
                        );
                }
            }
            return null;
        }
    },
    {
        'id': 'trainingjob.creation_time',
        width: 200,
        Header: 'Created Date',
        accessor: 'creation_time'
    },   
    {
        'id': 'trainingjob.model_data_url',
        width: 400,
        Header: 'Application Storage',
        accessor: 'model_data_url'
    }
]

const TrainTable_v2 = ({ t }) => {
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [modelList, setModelList] = useState([]);
    const [current, setCurrent] = useState([]);
    const [deleteModal, setDeleteModal] = useState(false);

    useEffect(() => {
        const load_data = async () => {
            setLoading(true);
            await API.get('backend', '/listModel').then(res => {
                console.log(res)
                if (res) {
                    // console.log(res.data)
                    const _tmp_data = []
                    res.forEach((item) => {
                        var _tmp = {}
                        _tmp['status'] = item['trainingJobStatus']
                        _tmp['model_data_url'] = item['trainingJobModelDataUrl']
                        if('trainingJobStartTime' in item){
                            _tmp['creation_time'] = new Date(item['trainingJobStartTime']).toLocaleString() 
                        }else{
                            _tmp['creation_time'] = ""
                        }
                        _tmp['stage'] = item['stage']
                        _tmp['model_name'] = item['model_name']
                        _tmp['model_creation_time'] = new Date(item['model.creation_time']).toLocaleString()
                        // _tmp['cost'] = Math.floor(Math.random() * 10000)
                        // _tmp['size'] = Math.floor(Math.random() * 10).toString() + 'GB'
                        _tmp_data.push(_tmp)
                    });

                    setModelList(_tmp_data);
                }
            })
            setLoading(false);
        }
        load_data();
    }, [])


    const jump_to_newTask = () => {
        // NEW ONE
        //history.push("/NewApplicationConfig")
        history.push("/NewTrainingTask")
    }

    const jump_to_clone_application = () => {
        history.push(`/CloneModelConfig/${current.model_name}`)
    }

    const deleteModel = async(title) => {
        console.log('paste')
        const payload = {
            'model_name':title
        }
        await API.del('backend','/deleteModel', { body: payload }).then(response => {
            if(response){
                console.log('Call')
            }
        }).catch((e)=>{
            console.log(e)
        })

        window.location.reload()
    }
    const tableActions = (

        <Inline>
            <ButtonDropdown
                content="Action"
                disabled={current.length === 0 ? true : false}
                // disabled={false}
                items={
                    [
                        { text: <Text>{t("Clone Model")}</Text>, onClick: () => jump_to_clone_application() },
                        { text: <Text>{t("Delete")}</Text>, onClick: () => setDeleteModal(true) }
                    ]
                }
            >
            </ButtonDropdown>
            <Button variant="primary" onClick={() => jump_to_newTask()}>
                {t("New Training")}
            </Button>
        </Inline>
    );
    return (
        <>
            <DeleteModal title={current.length === 0 ? 'Start' : current[0].model_name} setDeleteModal={setDeleteModal} deleteModal={deleteModal} deleteSubmit={deleteModel} />
            <Table
                id="TrainTable"
                actionGroup={tableActions}
                tableTitle={t("Packaged Application Table")}
                multiSelect={false}
                columnDefinitions={columnDefinitions}
                items={modelList}
                onSelectionChange={(item) => { setCurrent(item) }}
                loading={loading}
                disableSettings={false}
            />
        </>
    )
}

export default connect(mapStateToProps, MapDispatchTpProps)(withTranslation()(TrainTable_v2));
