/**
 * 轻量任务详情(看板)
 * Created by wrb on 2019/12/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_detail",
        defaults = {
            query:null,//query.fromType==1任务进来query.fromType==2模板编辑进来
            doType:1,//默认协同任务，doType==2==创建模板
            dataInfo:null,
            closeCallBack:null//关闭弹窗回滚
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._dataInfo = this.settings.dataInfo;

        this._kanbanType = 1;//1=标准看板，2=成员看板
        this._groupList = null;//看板列表
        this._panelSortable = null;//看板移动对象
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_light_project/m_light_project_detail', {
                doType:that.settings.doType,
                fromType:that.settings.query.fromType
            });
            $(that.element).html(html);
            that.renderContent();
        }

        //加载数据
        ,renderContent: function () {
            var that = this;

            var render = function () {

                var html = '';

                if(that._kanbanType==3){
                    html = template('m_light_project/m_light_project_detail_view_table', {
                        dataInfo:that._dataInfo,
                        doType:that.settings.doType,
                        fromType:that.settings.query.fromType,
                        kanbanType:that._kanbanType
                    });
                }else{
                    html = template('m_light_project/m_light_project_detail_kanban', {
                        dataInfo:that._dataInfo,
                        doType:that.settings.doType,
                        fromType:that.settings.query.fromType,
                        kanbanType:that._kanbanType
                    });
                }

                $(that.element).find('#projectContent').html(html);

                if(that._dataInfo && that._dataInfo.project){
                    that._breadcrumb = [{ name:'轻量任务',url:'#/lightProject'},{name:that._dataInfo.project.projectName}];
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
                }
                if($(that.element).find('.project-name').length>0)
                    $(that.element).find('.project-name').html(that._dataInfo.project.projectName);

                if(that.settings.doType==1 && ((that._dataInfo.principalUsr && that._dataInfo.principalUsr.companyUserId==window.currentCompanyUserId)
                        || (that._dataInfo.project && that._dataInfo.project.createBy==window.currentUserId) )){

                    $(that.element).find('button[data-action="delProject"],button[data-action="editProject"],button[data-action="addProjectMember"]').removeClass('hide');
                }else{
                    $(that.element).find('button[data-action="delProject"],button[data-action="editProject"],button[data-action="addProjectMember"]').addClass('hide');
                }

                that.bindHoverFun();
                that.initItemICheck();
                that.bindActionClick();
                that.resizeContentHeight();
                that.sortTable();
                that.bindEditable();
                $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            };

            var postFun = function (callBack) {
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_listLightProjectDetail;

                if(that._kanbanType==2)
                    option.url = restApi.url_lightProject_listLightProjectDetailGroupByUser;

                if(that._kanbanType==3)
                    option.url = restApi.url_lightProject_listLightProjectDetailForTable;

                option.postData = {};
                option.postData.id = that.settings.query.id;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that._dataInfo = response.data;//当前为复制任务模板时，直接赋值templateId变为null,再次刷新无需请求

                        if(that._kanbanType==1){
                            that._groupList = response.data.groupList;
                        }
                        if(that.settings.doType==2 && !isNullOrBlank(that.settings.dataInfo.templateId)){//去掉时间等无需的属性
                            if(that._dataInfo.groupList && that._dataInfo.groupList.length>0){
                                $.each(that._dataInfo.groupList,function (i,item) {
                                    if(item.detailList && item.detailList.length>0){
                                        $.each(item.detailList,function (si,sitem) {
                                            sitem.startDate = null;
                                            sitem.endDate = null;
                                        })
                                    }
                                })
                            }
                        }

                        if(callBack)
                            callBack();
                    } else {
                        S_layer.error(response.info);
                    }
                });
            };

            if(that.settings.doType==1 || (that.settings.doType==2 && !isNullOrBlank(that._dataInfo.templateId)) ){
                postFun(function () {
                    if(that._dataInfo.project.img && that._dataInfo.project.img.toString().length==1){
                        that._dataInfo.project.backgroundImage = that._dataInfo.project.img;
                    }else{
                        that._dataInfo.project.coverPath = that._dataInfo.project.img;
                    }

                    render();
                });
            }else{
                render();
            }

        }
        ,bindHoverFun:function () {
            var that = this;
            $(that.element).find('.row-hover').hover(function () {
                $(this).find('span').removeClass('hide');
            },function () {
                $(this).find('span').addClass('hide');
            });
        }
        ,addTaskFun:function ($this) {
            var that = this;
            var $box = $this.parent();
            var html = template('m_light_project/m_light_project_detail_task_item_add', {
                doType:that.settings.doType,
                fromType:that.settings.query.fromType
            });
            $this.after(html);
            $this.hide();
            $box.find('button[data-action="cancelAddTask"]').on('click',function () {
                $this.show();
                $box.find('form').remove();
                return false;
            });
            $box.find('button[data-action="saveAddTask"]').on('click',function () {

                var data = {};
                data.groupId = $(this).closest('.panel-kanban').attr('data-group-id');
                data.taskName = $box.find('input[name="taskName"]').val();
                data.startDate = $box.find('.input-time').attr('data-start-time');
                data.endDate = $box.find('.input-time').attr('data-end-time');
                data.principalUsrId = $box.find('a[data-action="selectUser"]').attr('data-value');
                if(that.settings.doType==2)
                    data.principalUsrName = $box.find('a[data-action="selectUser"] span').text();

                var severity = $box.find('#tagsBox .label').eq(0).attr('data-value');
                if(!isNullOrBlank(severity))
                    data.severity = severity;

                if(isNullOrBlank(data.taskName)){
                    S_toastr.error('输入新工作项标题');
                    return false;
                }
                that.saveTask(data,$this);
                return false;
            });
            $box.find('.input-time[data-action="selectTime"]').on('click',function () {
                var $inputTime = $(this);
                var startDate = $inputTime.attr('data-start-time');
                var endDate = $inputTime.attr('data-end-time');

                $inputTime.m_date_range_picker({
                    eleId : this,
                    startDate:startDate,
                    endDate:endDate,
                    placement : 'right',
                    ok:function (data) {
                        //console.log(data);
                        $inputTime.attr('data-start-time',data.startDate);
                        $inputTime.attr('data-end-time',data.endDate);

                        if(isNullOrBlank(data.startDate) && isNullOrBlank(data.endDate)){
                            $inputTime.html('<span class="fc-dark-gray">设置时间</span>');
                        }else{
                            $inputTime.html(momentFormat(data.startDate,'YYYY/MM/DD')+' - '+momentFormat(data.endDate,'YYYY/MM/DD'));
                        }


                    },
                    cancel:function () {

                    }
                });
            });
            $box.find('button[data-action="addTags"]').on('click',function () {
                var $tags = $(this);
                $tags.m_floating_popover({
                    content: template('m_light_project/m_light_project_detail_task_item_tags', {}),
                    placement: 'bottomLeft',
                    popoverClass: 'z-index-layer',
                    popoverStyle:{},
                    renderedCallBack: function ($popover) {
                        $popover.find('a').on('click',function () {

                            if($(this).hasClass('select')){
                                $(this).removeClass('select');
                            }else{
                                $(this).addClass('select');
                                $(this).addClass('select').parent().siblings().find('a').removeClass('select');
                            }

                            $box.find('#tagsBox').html('');
                            $popover.find('a.select').each(function () {
                                var clone = $(this).clone().removeClass('item-line select').css('cursor','default');
                                $box.find('#tagsBox').append(clone);
                            })
                        });
                    }
                }, true);
            });
            var $selectUser = $box.find('a[data-action="selectUser"]');
            $selectUser.m_editable({
                inline: true,
                popoverStyle:{'width':'230px'},
                hideElement: true,
                isNotSet: false,
                value: '',
                dataInfo: null,
                targetNotQuickCloseArr: ['select2-selection__choice', 'select2-search--dropdown', 'select2-search__field', 'select2-results__options'],
                postParam:{id:that.settings.query.id},
                closed: function (data, $popover) {

                    //console.log(data);
                    var user = '',userIds = [];
                    if (data != false) {
                        $.each(data['principalUsrId'],function (i,item) {
                            user += item.text+',';
                            userIds.push(item.id);
                        });
                        user = user.substring(0,user.length-1);
                    }
                    if(user==''){
                        $selectUser.html('<span class="fc-dark-gray">负责人</span>');
                        $selectUser.attr('data-value','');
                    }else{
                        $selectUser.html('<span class="fc-dark-grey">'+user+'</span>');
                        $selectUser.attr('data-value',userIds.join(','));
                    }

                    //$selectUser.removeClass('hide');
                },
                completed: function ($popover) {
                    //$selectUser.addClass('hide');
                    var selectedIds = $selectUser.attr('data-value');
                    if(!isNullOrBlank(selectedIds)){
                        var t = setTimeout(function () {
                            $popover.find('select').val(selectedIds).trigger('change');
                            clearTimeout(t);
                        },100);
                    }
                }
            }, true);

            $box.find('input[name="taskName"]').keydown(function (e) {
                if (event.keyCode == '13') {//keyCode=13是回车键

                    var groupId = $(this).closest('.panel-kanban').attr('data-group-id');
                    $box.find('button[data-action="saveAddTask"]').click();

                    var t = setTimeout(function () {
                        $(that.element).find('.panel-kanban[data-group-id="'+groupId+'"] a[data-action="addTask"]').click();
                        clearTimeout(t);
                    },300);
                    stopPropagation(e);
                    return false;

                }
            });
        }
        //初始ICheck
        ,initItemICheck:function () {
            var that = this;
            var ifChecked = function (e) {

                $(this).parents('.list-group-item').find('.task-name').addClass('todo-completed');

                var id = $(this).closest('.list-group-item').attr('data-id');
                that.saveLightProjectTaskComplete(id,1,$(this));

            };
            var ifUnchecked = function (e) {
                $(this).parents('.list-group-item').find('.task-name').removeClass('todo-completed');
                var id = $(this).closest('.list-group-item').attr('data-id');
                that.saveLightProjectTaskComplete(id,0,$(this));
            };
            $(that.element).find('input[name="taskItem"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //设置完成与否
        ,saveLightProjectTaskComplete:function (id,status,$this) {
            var that = this;
            if(that.settings.doType==2){

                var taskId = $this.closest('.list-group-item').attr('data-id');
                var groupId = $this.closest('.panel-kanban').attr('data-group-id');
                $.each(that._dataInfo.groupList,function (i,item) {
                    if(item.group.id==groupId){
                        $.each(item.detailList,function (ci,citem) {
                            if(citem.id == taskId){
                                citem.isComplete = status;
                                if(status==1){//完成
                                    citem.completeDate = moment().format('YYYY-MM-DD');
                                }else{
                                    citem.completeDate = null;
                                }
                                return false;
                            }
                        });
                        return false;
                    }
                });
                //that.renderContent();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveLightProjectTaskComplete;
                option.postData = {};
                option.postData.id = id;
                option.postData.isComplete  = status;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');
                        if($this==null)
                            that.renderContent();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }

        }
        //保存任务任务的分组
        ,saveTaskGroup:function (postData) {
            var that = this;
            //console.log(postData)
            if(that.settings.doType==2){
                if(postData.id==null){//添加
                    var groupId = UUID.genV4().hexNoDelim;
                    that._dataInfo.groupList.push({
                        detailList:[],
                        group:{id:groupId,name:postData.groupName},
                        id:groupId
                    });

                }else{//修改
                    $.each(that._dataInfo.groupList,function (i,item) {
                        if(item.group.id==postData.id){
                            item.group.name = postData.groupName;
                            return false;
                        }
                    });
                }
                that.renderContent();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveTaskGroup;
                option.postData = postData;
                option.postData.lightProjectId = that.settings.query.id;
                option.postData.type = 2;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');
                        that.renderContent();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //保存任务任务
        ,saveTask:function (postData,$this) {
            var that = this;

            //console.log(postData);
            if(that.settings.doType==2){

                var groupId = $this.closest('.panel-kanban').attr('data-group-id');
                $.each(that._dataInfo.groupList,function (i,item) {
                    if(item.group.id==groupId){
                        item.detailList.push({
                            id:UUID.genV4().hexNoDelim,
                            groupId:groupId,
                            taskName:postData.taskName,
                            startDate:postData.startDate,
                            endDate:postData.endDate,
                            severity:postData.severity,
                            principalUsrId:postData.principalUsrId,
                            principalUser:{
                                companyUserId:postData.principalUsrId,
                                userName:postData.principalUsrName
                            }
                        });
                        return false;
                    }
                });
                that.renderContent();

            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_lightProject_saveTask;
                option.postData = postData;
                option.postData.lightProjectId = that.settings.query.id;
                option.postData.type = 1;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        S_toastr.success('操作成功！');
                        that.renderContent();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        ,postProjectMemberAdd:function(selectedUserList){
            var that = this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_lightProject_saveLightProjectMember;
            option.postData={};
            option.postData.lightProjectId=that.settings.query.id;
            option.postData.memberList=selectedUserList;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,delTaskGroup:function (groupId) {
            var that = this;
            if(that.settings.doType==2){

                var groupIndex = $(that.element).find('.panel-kanban[data-group-id="'+groupId+'"]').attr('data-i');
                that._dataInfo.groupList.splice(groupIndex,1);
                that.renderContent();

            }else{
                var option = {};
                option.url = restApi.url_lightProject_deleteTaskGroup;
                option.postData = {};
                option.postData.id = groupId;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('删除成功！');
                        that.renderContent();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action],span[data-action],tr[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var groupId = $this.closest('.panel.panel-kanban').attr('data-group-id');
                var taskId = $this.closest('.list-group-item').attr('data-id');


                switch (dataAction){
                    case 'taskDetail':

                        var dataInfo = null;
                        var groupItem = null;
                        if(that.settings.doType==2){
                            groupItem = null;//getObjectInArray(that._dataInfo.groupList,groupId)
                            $.each(that._dataInfo.groupList,function (i,item) {
                                if(item.group.id==groupId){
                                    groupItem = item;
                                    return false;
                                }
                            });

                            var dataItem = getObjectInArray(groupItem.detailList,taskId);
                            var group = null;
                            if(groupItem.group){
                                group = {id:groupItem.group.id,groupName:groupItem.group.name};
                            }
                            dataInfo = {task:dataItem,group:group};
                            if(!isNullOrBlank(dataItem.principalUser))
                                dataInfo.principalUser = dataItem.principalUser;

                            if(!isNullOrBlank(dataItem.checkItemList))
                                dataInfo.checkItemList = dataItem.checkItemList;

                            if(!isNullOrBlank(dataItem.memberList))
                                dataInfo.memberList = dataItem.memberList;

                        }else if(that._kanbanType==3){//表格看板

                            //当编辑时点击行，拦截弹窗
                            if($(that.element).find('.m-editable').length>0){
                                return false;
                            }

                            taskId = $this.closest('tr').attr('data-id');
                            var dataItem = getObjectInArray(that._dataInfo.list,taskId);
                            dataInfo = {task:dataItem};
                            if(!isNullOrBlank(dataItem.principalUser))
                                dataInfo.principalUser = dataItem.principalUser;

                            if(!isNullOrBlank(dataItem.checkItemList))
                                dataInfo.checkItemList = dataItem.checkItemList;

                            if(!isNullOrBlank(dataItem.memberList))
                                dataInfo.memberList = dataItem.memberList;

                        }
                        //console.log(dataInfo);
                        $('body').m_light_project_task_detail({
                            doType:that.settings.doType,
                            fromType:that.settings.query.fromType,
                            groupId:groupId,
                            lightProjectId:that.settings.query.id,
                            taskId:taskId,
                            dataInfo:dataInfo,
                            groupList:that._groupList,
                            saveCallBack:function () {
                                //that.renderContent();
                            },
                            closeCallBack:function (data) {
                                //console.log('m_light_project_task_detail..closeCallBack');
                                //console.log(data);
                                //还原数据
                                if(that.settings.doType==2){
                                    $.each(that._dataInfo.groupList,function (i,item) {
                                        if(data.task){
                                            if(item.group.id==data.task.groupId){
                                                $.each(item.detailList,function (ci,citem) {
                                                    if(citem.id==taskId){
                                                        $.extend(citem, data.task);
                                                        $.extend(citem, data);
                                                        citem.principalUsrId = data.principalUser?data.principalUser.companyUserId:null;
                                                        return false;
                                                    }
                                                });
                                                return false;
                                            }
                                        }else{//被删掉
                                            if(item.group.id==groupId){
                                                delObjectInArray(item.detailList,function (obj) {
                                                    return obj.id == taskId;
                                                });
                                                return false;
                                            }
                                        }

                                    });
                                }
                                that.renderContent();
                            }
                        });

                        break;

                    case 'addTask':

                        that.addTaskFun($this);
                        break;
                    case 'editProject'://编辑任务

                        if(that.settings.query && that.settings.query.fromType==2){

                            $('body').m_light_project_temp_add_simple({
                                doType:2,
                                dataInfo:that._dataInfo.project,
                                saveCallBack:function (data) {
                                    that._dataInfo.project.backgroundImage = data.backgroundImage;
                                    that._dataInfo.project.coverPath = data.coverPath;

                                    that.init();
                                }
                            });

                        }else{
                            $('body').m_light_project_add({
                                title:'编辑任务',
                                dataInfo:{
                                    projectName:that._dataInfo.project.projectName,
                                    id:that._dataInfo.project.id,
                                    groupId:that._dataInfo.project.groupId,
                                    startDate:that._dataInfo.project.startDate,
                                    endDate:that._dataInfo.project.endDate,
                                    status:that._dataInfo.project.status,
                                    principalUsr:that._dataInfo.principalUsr

                                },
                                saveCallBack:function () {
                                    that.init();
                                }
                            });
                        }
                        break;
                    case 'delProject'://删除任务
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_lightProject_deleteLightProject;
                            option.postData = {};
                            option.postData.id = that.settings.query.id;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    if(that.settings.query.fromType==2){
                                        location.hash = '#/myTask/light';
                                    }else{
                                        location.hash = '#/lightProject';
                                    }

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                    case 'addProjectMember'://添加人员
                        var option = {};
                        option.postData = {};
                        option.url = restApi.url_lightProject_listLightProjectPartMember;
                        option.postData.id=that.settings.query.id;
                        m_ajax.postJson(option,function (response) {
                            if(response.code=='0'){
                                var options = {};
                                options.isASingleSelectUser = false;
                                options.selectedUserList = response.data || [];
                                options.title = '添加任务人员';
                                options.isOkSave = true;
                                options.saveCallback = function (data, $ele) {
                                    var obj = {};
                                    obj.type = 99;
                                    if(data!=null && data.selectedUserList!=null && data.selectedUserList.length>0){
                                        $.each(data.selectedUserList,function (i,item) {
                                            item.companyUserId = item.id
                                        });
                                        that.postProjectMemberAdd(data.selectedUserList);
                                    }
                                };
                                $('body').m_orgByTree(options);
                            }else {
                                S_layer.error(response.info);
                            }
                        });
                        break;

                    case 'delGroup'://删除分组
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            that.delTaskGroup($this.attr('data-id'));

                        }, function () {
                        });
                        break;

                    case 'editGroupName'://修改版块名称

                        var t = setTimeout(function () {
                            var $group = $(that.element).find('.panel-kanban[data-group-id="'+$this.attr('data-id')+'"]');
                            $group.find('a.task-group-name').eq(0).click();
                            var val = $group.find('.m-floating-popover input').val();
                            $group.find('.m-floating-popover input').val('').focus().val(val);
                            clearTimeout(t);
                        },500);

                        break;
                    case 'dropdownToggle'://版块按钮组

                        var $html = $this.next().clone();
                        var content = $html.removeClass('hide').addClass('dp-block').prop('outerHTML');
                        $this.m_floating_popover({
                            content: content,
                            placement: 'bottomLeft',
                            popoverClass: 'z-index-layer',
                            popoverStyle:{'border':'0','box-shadow':'none'},
                            renderedCallBack: function ($popover) {
                                $popover.find('a[data-action]').on('click',function () {
                                    $this.m_floating_popover('closePopover');//关闭浮窗
                                    var dataAction = $(this).attr('data-action');
                                    $this.next().find('a[data-action="'+dataAction+'"]').click();
                                    return false;
                                });
                            }
                        }, true);
                        break;

                    case 'closeDialog':
                        S_layer.close($(that.element));
                        if(that.settings.closeCallBack)
                            that.settings.closeCallBack();
                        break;
                    case 'delTask'://删除任务
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            if(that.settings.doType==2){

                                var groupIndex = $(that.element).find('.panel-kanban[data-group-id="'+groupId+'"]').attr('data-i');
                                var taskIndex = $(that.element).find('.panel-kanban[data-group-id="'+groupId+'"] li.list-group-item[data-id="'+$this.attr('data-id')+'"]').attr('data-i');
                                that._dataInfo.groupList[groupIndex].detailList.splice(taskIndex,1);
                                that.renderContent();

                            }else{
                                var option = {};
                                option.url = restApi.url_lightProject_deleteLightProjectTask;
                                option.postData = {};
                                option.postData.id = $this.attr('data-id');
                                m_ajax.postJson(option, function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('删除成功！');
                                        that.renderContent();

                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            }

                        }, function () {
                        });
                        break;
                    case 'xeditable_moveTask'://表格看板移动
                        var dataType = $this.attr('data-type');
                        var dataId = $this.attr('data-id');
                        $this.parents('td').m_light_project_task_copy({
                            doType:dataType,
                            taskId:dataId,
                            lightProjectId:that.settings.query.id,
                            saveCallBack:function (data) {
                                //当前任务复制或移动，刷新
                                if(data.lightProjectId==that.settings.query.id){
                                    that.renderContent();
                                }
                            }
                        });
                        break;
                    case 'moveTask'://移动
                    case 'copyTask'://复制
                        var dataType = $this.attr('data-type');
                        var dataId = $this.attr('data-id');
                        $this.parents('div.btn-group').removeClass('open');
                        $this.parents('div.btn-group').parent().m_light_project_task_copy({
                            doType:dataType,
                            taskId:dataId,
                            lightProjectId:that.settings.query.id,
                            saveCallBack:function (data) {
                                //console.log(data);
                                //当前任务复制或移动，刷新
                                if(data.lightProjectId==that.settings.query.id){
                                    that.renderContent();
                                }
                            }
                        });
                        break;
                    case 'switchProject'://标准看板

                        that._kanbanType = 1;
                        $(that.element).find('button[data-action="switchProject"]').removeClass('btn-outline').siblings('button[data-action="switchProjectByUser"]').addClass('btn-outline');
                        that.renderContent();
                        break;
                    case 'switchProjectByUser'://成员看板
                        that._kanbanType = 2;
                        $(that.element).find('button[data-action="switchProjectByUser"]').removeClass('btn-outline').siblings('button[data-action="switchProject"]').addClass('btn-outline');
                        that.renderContent();
                        break;
                    case 'switchProjectByView'://视图切换

                        var type = $this.attr('data-type');
                        that._kanbanType = type;
                        $this.removeClass('btn-outline').siblings('button[data-action="switchProjectByView"]').addClass('btn-outline');
                        that.renderContent();
                        break;
                }

                return false;
            });

            $(that.element).find('a[data-action="addTaskGroup"]').each(function () {
                var $this = $(this);
                $this.m_editable({
                    inline:true,
                    popoverClass : 'full-width',
                    editableControlStyle:'width:165px',
                    hideElement:true,
                    isNotSet:false,
                    value:'',
                    dataInfo:null,
                    ok:function (data) {
                        //console.log(data);
                        that.saveTaskGroup(data);

                    },
                    cancel:function () {

                    },
                    completed: function ($popover) {

                    }
                },true);
            });
            $(that.element).find('a[data-action="editTaskGroup"]').each(function () {
                var $this = $(this),groupId = $this.closest('.panel-kanban').attr('data-group-id');
                $this.m_editable({
                    inline:true,
                    popoverClass : '',
                    editableControlStyle:'width:190px',
                    hideElement:true,
                    isNotSet:false,
                    value:$this.attr('data-value'),
                    dataInfo:null,
                    closed:function (data) {
                        //console.log(data);
                        if(data!=false){
                            data.id = groupId;
                            that.saveTaskGroup(data);
                        }
                    },
                    completed: function ($popover) {

                    }
                },true);
            });

        }
        ,resizeContentHeight:function () {
            var that = this;
            var setContentHeight = function () {
                var windowH = $(window).height();
                var headerH = $('.navbar.m-top').height();
                if(that.settings.doType==2){
                    headerH = 30;
                }
                $(that.element).find('#projectContent').css('height',(windowH-headerH-51)+'px');
                $(that.element).find('.panel.panel-kanban').css('max-height',(windowH-headerH-75)+'px');
            };

            $(window).resize(function () {
                setContentHeight();
            });
            setContentHeight();
        }
        ,getProjectInfoData:function (callBack) {
            var that = this;
            //console.log('getProjectInfoData')
            if(callBack)
                callBack(that._dataInfo);
        }
        ,saveGroupSort:function (groupId) {
            var that = this;
            if(that.settings.doType==2){

                var newGroupList = [];
                $(that.element).find('.panel.panel-kanban[data-group-id]').each(function () {
                    var index = $(this).attr('data-i');
                    newGroupList.push(that._dataInfo.groupList[index]);
                });
                that._dataInfo.groupList = newGroupList;
                that.renderContent();

            }else{
                var option = {};
                option.url = restApi.url_lightProject_moveGroupList;
                option.postData = {};

                var moveList = [];
                $(that.element).find('.panel-kanban[data-group-id]').each(function (i) {
                    moveList.push($(this).attr('data-group-id'));
                });
                option.postData.moveList = moveList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that.renderContent();
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        ,saveTaskSort:function (targetId) {
            var that = this;

            //模板编辑不存在人员看板,不做人员看板移动处理
            if(that.settings.doType==2){

                var $targetLi = $(that.element).find('.panel-kanban ul li.list-group-item[data-id="'+targetId+'"]');
                var originalGroupId = $targetLi.attr('data-original-group');
                var groupId = $targetLi.parents('.panel-kanban').attr('data-group-id');

                if(groupId==originalGroupId){//同列表移动

                    $.each(that._dataInfo.groupList,function (i,item) {
                        if(item.group.id==groupId){

                            var newDetailList = [];
                            $targetLi.parent().find('li.list-group-item').each(function () {
                                var index = $(this).attr('data-i');
                                newDetailList.push(item.detailList[index]);
                            });
                            item.detailList = newDetailList;
                            return false;
                        }
                    });

                }else{//不同列表移动

                    //删除原列表
                    var originalTask = {};//声明原对象
                    $.each(that._dataInfo.groupList,function (i,item) {
                        if(item.group.id==originalGroupId){
                            originalTask = item.detailList[$targetLi.attr('data-i')];
                            delObjectInArray(item.detailList,function (obj) {
                                return obj.id == targetId;
                            });
                            return false;
                        }
                    });
                    //添加到新列表
                    $.each(that._dataInfo.groupList,function (i,item) {
                        if(item.group.id==groupId){
                            var newDetailList = [];
                            $targetLi.parent().find('li.list-group-item').each(function () {
                                var index = $(this).attr('data-i');
                                var taskId = $(this).attr('data-id');
                                if(taskId==targetId){
                                    newDetailList.push(originalTask);
                                }else{
                                    newDetailList.push(item.detailList[index]);
                                }
                            });
                            item.detailList = newDetailList;
                            return false;
                        }
                    });
                }

                that.renderContent();

            }else{
                var option = {};
                option.url = restApi.url_lightProject_moveLightProjectTaskList;
                option.postData = {};
                var moveList = [];
                $(that.element).find('.panel-kanban ul li[data-id="'+targetId+'"]').parent().find('li[data-id]').each(function () {
                    moveList.push($(this).attr('data-id'));
                });
                option.postData.moveList = moveList;

                if(that._kanbanType==1){

                    option.postData.groupId = $(that.element).find('.panel-kanban ul li[data-id="'+targetId+'"]').parents('.panel-kanban').attr('data-group-id');

                }else{//人员看板

                    option.url = restApi.url_lightProject_moveLightProjectTaskListGroupByUser;
                    var groupId = $(that.element).find('.panel-kanban ul li[data-id="'+targetId+'"]').parents('.panel-kanban').attr('data-group-id');
                    if(groupId!=undefined && groupId!='0'){
                        option.postData.principalUsrId = groupId;
                    }
                    option.postData.id = targetId;

                }

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that.renderContent();
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //拖拽
        ,sortTable: function () {
            var that = this;

            if(that._panelSortable!=null)
                that._panelSortable.destroy();

            that._panelSortable = Sortable.create(document.getElementById('projectContent'), {
                animation: 200,
                handle: '.panel-heading',
                filter: '.task-group-add',
                dataIdAttr: 'data-group-id',
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                sort: that._kanbanType==1?true:false,
                disabled: that._kanbanType==1?false:true,
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt);
                    that.saveGroupSort();
                }
            });

            $(that.element).find('.panel-kanban .panel-body .list-group').each(function (i) {
                var id = $(this).attr('id');
                new Sortable(document.getElementById(id), {
                    group: 'shared',
                    animation: 150,
                    onStart: function (/**Event*/evt) {
                        //evt.oldIndex;

                        //设置空白可拖进该列表
                        $(that.element).find('.panel-body .list-group').each(function () {
                            var $this = $(this);
                            if($this.find('li.list-group-item').length==0){
                                $this.css('min-height','50px');
                            }
                        });

                    },
                    onClone:function (evt) {
                        var origEl = evt.item;
                        var cloneEl = evt.clone;
                        //console.log(cloneEl);
                    },
                    onMove:function (evt, originalEvent) {

                        //console.log(evt)

                    },
                    onEnd: function (evt) {
                        evt.oldIndex;  // element's old index within parent
                        evt.newIndex;  // element's new index within parent
                        console.log(evt);

                        that.saveTaskSort($(evt.item).attr('data-id'));
                        //设置空白-去掉
                        $(that.element).find('.panel-body .list-group').removeAttr('style');
                    }
                });
            });
        }
        //列表视图在位编辑
        ,bindEditable:function () {
            var that = this;
            //hover展示编辑图标
            $(that.element).find('a[data-action^="xeditable"]').closest('td').hover(function () {
                if(!($(this).find('.m-editable').length>0)){
                    $(this).find('a[data-action^="xeditable"]').css('visibility','visible');
                }
            },function () {
                if(!($(this).find('.m-editable').length>0)) {
                    $(this).find('a[data-action^="xeditable"]').css('visibility','hidden');
                }
            });
            $(that.element).find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                var noInternalInit = false;
                var popoverClass = 'full-width';
                var editType = $this.attr('data-edit-type');
                var targetNotQuickCloseArr = [];

                //dataItem为空,重新赋值
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataItem = getObjectInArray(that._dataInfo.list,dataId);

                if(key=='isComplete'){
                    dataInfo = [{id: 0, name: '进行中'},
                        {id: 1, name: '已完成'}];
                }else if(key=='principalUsrId'){
                    value = [];
                    if(dataItem.principalUser && dataItem.principalUser.companyUserId){
                        value.push({id:dataItem.principalUser.companyUserId,text:dataItem.principalUser.userName});
                    }
                }else if(key=='severity'){
                    dataInfo = [{id:1, name: '高'},
                        {id: 2, name: '中'},
                        {id: 3, name: '低'}];
                }else if(key=='memberList'){
                    value = [];
                    if(dataItem.memberList && dataItem.memberList.length>0){
                        $.each(dataItem.memberList,function (i,item) {
                            value.push({id:item.companyUserId,text:item.userName})
                        });
                    }
                }

                $this.m_editable({
                    inline:true,
                    popoverClass : popoverClass,
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:{id:that.settings.query.id},
                    targetNotQuickCloseArr: ['select2-selection__choice', 'select2-search--dropdown', 'select2-search__field', 'select2-results__options'],
                    closed:function (data,$popover) {
                        //console.log(data)
                        if(data!=false){

                            var param = {};
                            if(key=='isComplete'){

                                that.saveLightProjectTaskComplete(dataId,data[key]);

                            }else if(key=='principalUsrId'){
                                that.savePrincipal(1,data,dataId);
                            }else if(key=='memberList'){
                                that.savePrincipal(2,data,dataId);
                            }else{
                                if(data[key]!=null){
                                    param[key] = data[key];
                                    param.groupId = dataItem.groupId;
                                    param.id = dataId;
                                    that.saveTask(param);
                                }
                            }


                        }
                        $this.parent().find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                },true);
            });
        }
        //保存负责人{type=1=负责人,type=2=参与人}
        ,savePrincipal:function (type,userList,dataId) {
            var that = this;

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_savePrincipal;
            option.postData = {};
            option.postData.id = dataId;

            if (type == 2) {
                option.url = restApi.url_lightProject_saveLightProjectTaskMember;
                option.postData.memberList = [];
                if (userList != false) {
                    $.each(userList.memberList, function (i, item) {
                        option.postData.memberList.push({id: item.id});
                    });
                }
            } else {
                option.postData.principalUsrId = userList == false ? [] : userList.principalUsrId[0].id;
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    that.renderContent();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
