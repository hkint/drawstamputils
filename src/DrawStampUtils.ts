// 标尺宽度
import {
  IAgingEffect,
  ICode, ICompany, IDrawImage, IDrawStampConfig,
  IDrawStar,
  IInnerCircle, IRoughEdge,
  ISecurityPattern,
  IShowRuler, IStampType,
  ITaxNumber
} from "./DrawStampTypes.ts";
// 标尺宽度
const RULER_WIDTH = 80
// 标尺高度
const RULER_HEIGHT = 80

/**
 * 绘制印章工具类
 */
export class DrawStampUtils {
    // 缩放参数
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    // 默认主色
    private primaryColor: string = '#ff0000'
    // 毫米到像素的
    private mmToPixel: number
    // 主canvas的context
    private canvasCtx: CanvasRenderingContext2D
    // 离屏的canvas
    private offscreenCanvas: HTMLCanvasElement
    // 主canvas
    private canvas: HTMLCanvasElement
    private stampOffsetX: number = 0
    private stampOffsetY: number = 0
    private agingIntensity: number = 50
    private ruler: IShowRuler = {
        showRuler: true,
        showFullRuler: true,
        showCrossLine: true,
        showDashLine: true,
        showSideRuler: true,
        showCurrentPositionText: true
    }
    private drawStar: IDrawStar = {
        svgPath: 'M 0 -1 L 0.588 0.809 L -0.951 -0.309 L 0.951 -0.309 L -0.588 0.809 Z',
        drawStar: false,
        starDiameter: 14,
        starPositionY: 0,
        scaleToSmallStar: false
    }
    // 防伪纹路
    private securityPattern: ISecurityPattern = {
        openSecurityPattern: true,
        securityPatternWidth: 0.15,
        securityPatternLength: 3,
        securityPatternCount: 5,
        securityPatternAngleRange: 40,
        securityPatternParams: []
    }
    private company: ICompany = {
        companyName: '印章绘制有限责任公司',
        compression: 1,
        borderOffset: 1,
        textDistributionFactor: 5,
        fontFamily: 'SimSun',
        fontHeight: 4.2,
        fontWeight: 'normal',
        shape: 'ellipse',
        adjustEllipseText: false,
        adjustEllipseTextFactor: 0.5,
        startAngle: 0,
        rotateDirection: "counterclockwise"
    }
    private taxNumber: ITaxNumber = {
        code: '000000000000000000',
        compression: 0.7,
        fontHeight: 3.7,
        fontFamily: 'Arial',
        fontWidth: 1.3,
        letterSpacing: 8,
        positionY: 0,
        totalWidth: 26,
        fontWeight: 'normal',
    }
    private stampCode: ICode = {
        code: '1234567890',
        compression: 1,
        fontHeight: 1.2,
        fontFamily: 'Arial',
        borderOffset: 1,
        fontWidth: 1.2,
        textDistributionFactor: 50,
        fontWeight: 'normal',
    }
    private stampType: IStampType = {
        stampType: '印章类型',
        fontHeight: 4.6,
        fontFamily: 'Arial',
        fontWidth: 3,
        compression: 0.75,
        letterSpacing: 0,
        positionY: -3,
        fontWeight: 'normal',
        lineSpacing: 2 // 新增：行间距
    }
    // 做旧效果
    private agingEffect: IAgingEffect = {
        applyAging: false,
        agingIntensity: 50,
        agingEffectParams: []
    }

    // 内圈圆
    private innerCircle: IInnerCircle = {
        drawInnerCircle: true,
        innerCircleLineWidth: 0.5,
        innerCircleLineRadiusX: 16,
        innerCircleLineRadiusY: 12
    }
    // 比外圈细的稍微内
    private outThinCircle: IInnerCircle = {
        drawInnerCircle: true,
        innerCircleLineWidth: 0.2,
        innerCircleLineRadiusX: 36,
        innerCircleLineRadiusY: 27
    }
    // 毛边效果
    private roughEdge: IRoughEdge = {
        drawRoughEdge: true,
        roughEdgeWidth: 0.2,
        roughEdgeHeight: 5,
        roughEdgeParams: [],
        roughEdgeProbability: 0.3,
        roughEdgeShift: 8,
        roughEdgePoints: 360
    }
    // 印章类型列表，用于多行的文字显示，且可以设置每行的高度和文字宽度，默认添加一个发票专用章类型
    private stampTypeList: IStampType[] = [
        {
            stampType: '印章类型',
            fontHeight: 4.6,
            fontFamily: 'Arial',
            fontWidth: 3,
            compression: 0.75,
            letterSpacing: 0,
            positionY: -3,
            fontWeight: 'normal',
            lineSpacing: 2 // 新增：行间距
        }
    ]
    // 添加公司列表属性
    private companyList: ICompany[] = [
        {
            companyName: '绘制印章有限责任公司',
            compression: 1,
            borderOffset: 1,
            textDistributionFactor: 3, // 将默认值从20改为10
            fontFamily: 'SimSun',
            fontHeight: 4.2,
            fontWeight: 'normal',
            shape: 'ellipse',
            adjustEllipseText: true,
            adjustEllipseTextFactor: 0.5,
            startAngle: 0,
            rotateDirection: "counterclockwise"
        }
    ]
    // 内圈圆列表
    private innerCircleList: IInnerCircle[] = [];
    // 图片列表
    private imageList: IDrawImage[] = [];
    // 总的印章绘制参数
    private drawStampConfigs: IDrawStampConfig = {
        roughEdge: this.roughEdge,
        ruler: this.ruler,
        drawStar: this.drawStar,
        securityPattern: this.securityPattern,
        company: this.company,
        stampCode: this.stampCode,
        width: 40,
        height: 30,
        stampType: this.stampType,
        primaryColor: this.primaryColor,
        borderWidth: 1,
        refreshSecurityPattern: false,
        refreshOld: false,
        taxNumber: this.taxNumber,
        agingEffect: this.agingEffect,
        innerCircle: this.innerCircle,
        outThinCircle: this.outThinCircle,
        openManualAging: false,
        stampTypeList: this.stampTypeList,
        companyList: this.companyList,
        innerCircleList: this.innerCircleList,
        imageList: this.imageList
    }

    // 添加图片缓存
    private imageCache: Map<string, ImageBitmap> = new Map();

    /**
     * 构造函数
     * @param canvas 画布
     * @param mmToPixel 毫米到像素的转换比例
     */
    constructor(canvas: HTMLCanvasElement | null, mmToPixel: number) {
        if (!canvas) {
            throw new Error('Canvas is null')
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('Failed to get canvas context')
        }
        this.canvasCtx = ctx
        this.mmToPixel = mmToPixel
        this.canvas = canvas
        // 创建离屏canvas
        this.offscreenCanvas = document.createElement('canvas')

        if (this.canvas && this.offscreenCanvas) {
            this.offscreenCanvas.width = canvas.width
            this.offscreenCanvas.height = canvas.height
        }
        this.addCanvasListener()
    }


    private isDragging = false
    private dragStartX = 0
    private dragStartY = 0

    // 获取绘制印章的配置
    getDrawConfigs() {
        return this.drawStampConfigs
    }

    /**
     * 手动做旧效果
     * @param x
     * @param y
     * @param intensity
     */
    addManualAgingEffect(x: number, y: number, intensityFactor: number) {
        console.log('手动做旧   1', x, y, this.drawStampConfigs.agingEffect.agingEffectParams)
        const radius = 1 * this.mmToPixel; // 直径3mm，半径1.5mm

        // 考虑印章偏移量
        const adjustedX = x - this.stampOffsetX * this.mmToPixel;
        const adjustedY = y - this.stampOffsetY * this.mmToPixel;

        for (let i = 0; i < 10; i++) {
            // 将点击的地方增加一个做旧数据到做旧的列表里面
            this.drawStampConfigs.agingEffect.agingEffectParams.push({
                x: adjustedX,
                y: adjustedY,
                noiseSize: Math.random() * 3 + 1,
                noise: Math.random() * 200 * intensityFactor,
                strongNoiseSize: Math.random() * 5 + 2,
                strongNoise: Math.random() * 250 * intensityFactor + 5,
                fade: Math.random() * 50 * intensityFactor,
                seed: Math.random()
            })
        }

        // 立即刷新画布以显示效果
        this.refreshStamp(false, false);

        // 绘制鼠标点击效果
        this.canvasCtx.save();
        this.canvasCtx.globalCompositeOperation = 'destination-out'; // 改变这里
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(x, y, radius, 0, Math.PI * 2, true);
        this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 使用白色，但透明度降低
        this.canvasCtx.fill();
        this.canvasCtx.restore();
    }

    // 设置绘制印章的配置，比如可以保存某些印章的配置，然后保存之后直接设置绘制，更加方便
    setDrawConfigs(drawConfigs: IDrawStampConfig) {
        this.drawStampConfigs = drawConfigs
    }

    private addCanvasListener() {
        this.canvas.addEventListener('mousemove', (event) => {
            if (this.drawStampConfigs.openManualAging && event.buttons === 1) {
                const rect = this.canvas.getBoundingClientRect()
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const agingIntensity = this.drawStampConfigs.agingEffect.agingIntensity / 100;
                this.addManualAgingEffect(x, y, agingIntensity);
            } else {
                this.onMouseMove(event)
            }
        })
        this.canvas.addEventListener('mouseleave', (event) => {
            this.onMouseLeave(event)
        })
        this.canvas.addEventListener('mousedown', (event) => {
            this.onMouseDown(event)
            if (this.drawStampConfigs.openManualAging) {
                // 添加手动做旧效果
                const rect = this.canvas.getBoundingClientRect()
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                // 增加做旧效果的强度
                const agingIntensity = this.drawStampConfigs.agingEffect.agingIntensity / 100; // 将强度调整为原来的2倍
                this.addManualAgingEffect(x, y, agingIntensity);
            }
        })
        this.canvas.addEventListener('mouseup', (event) => {
            this.onMouseUp()
        })
        this.canvas.addEventListener('click', (event) => {
            this.onCanvasClick(event)
        })
        // 添加鼠标滚轮事件监听器
        this.canvas.addEventListener('wheel', (event: WheelEvent) => {
            if (event.ctrlKey) {
                event.preventDefault();
                const zoom = event.deltaY > 0 ? 0.9 : 1.1;
                this.zoomCanvas(event.offsetX, event.offsetY, zoom);
            }
        });
    }

    private zoomCanvas(mouseX: number, mouseY: number, zoom: number) {
        const oldScale = this.scale;
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale)); // 限制缩放范围

        // 调整偏移量以保持鼠标位置不变
        this.offsetX = mouseX - (mouseX - this.offsetX) * (this.scale / oldScale);
        this.offsetY = mouseY - (mouseY - this.offsetY) * (this.scale / oldScale);

        this.refreshStamp();
    }

    private onMouseUp = () => {
        this.isDragging = false
        this.refreshStamp(false, false);
    }

    // 点击印章区域，比如五角星等位置然后进行相应的跳转之类的
    private onCanvasClick = (event: MouseEvent) => {
        const canvas = this.canvas
        if (!canvas) return
    }

    private onMouseLeave = (event: MouseEvent) => {
        this.isDragging = false
        this.refreshStamp()
    }

    private onMouseDown = (event: MouseEvent) => {
        this.isDragging = true
        this.dragStartX = event.clientX - this.stampOffsetX * this.mmToPixel
        this.dragStartY = event.clientY - this.stampOffsetY * this.mmToPixel
    }

    private onMouseMove = (event: MouseEvent) => {
        if (this.drawStampConfigs.openManualAging) {
            return
        }
        
        if (this.isDragging) {
            const newOffsetX = (event.clientX - this.dragStartX) / this.mmToPixel
            const newOffsetY = (event.clientY - this.dragStartY) / this.mmToPixel
            this.stampOffsetX = Math.round(newOffsetX * 10) / 10 // 四舍五入到小数点后一位
            this.stampOffsetY = Math.round(newOffsetY * 10) / 10
            this.refreshStamp()
        } else {
            // 原有的鼠标移动逻辑
            const rect = this.canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            const mmX = Math.round(((x - RULER_WIDTH) / this.mmToPixel) * 10) / 10
            const mmY = Math.round(((y - RULER_HEIGHT) / this.mmToPixel) * 10) / 10

            this.refreshStamp()
            if (this.drawStampConfigs.ruler.showCurrentPositionText) {
                this.drawCurrentPositionText(this.canvasCtx, mmX, mmY)
            }
            if (this.drawStampConfigs.ruler.showCrossLine) {
                this.drawCrossLines(x, y)
            }
        }
    }

    private drawCurrentPositionText = (ctx: CanvasRenderingContext2D, mmX: number, mmY: number) => {
        // 显示坐标
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const showPositionX = mmX / this.scale
        const showPositionY = mmY / this.scale
        ctx.fillText(`${showPositionX.toFixed(1)}mm, ${showPositionY.toFixed(1)}mm, scale: ${this.scale.toFixed(2)}`, RULER_WIDTH + 5, RULER_HEIGHT + 5);
    }

    private drawCrossLines = (x: number, y: number) => {
        const canvas = this.offscreenCanvas
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 清除之前绘制的内容
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
        ctx.lineWidth = 1

        // 绘制水平线
        ctx.moveTo(RULER_WIDTH, y)
        ctx.lineTo(canvas.width, y)

        // 绘制垂直线
        ctx.moveTo(x, RULER_HEIGHT)
        ctx.lineTo(x, canvas.height)

        ctx.stroke()

        // 将离屏canvas的内容绘制到主canvas上
        const mainCanvas = this.canvas
        if (mainCanvas) {
            const mainCtx = mainCanvas.getContext('2d')
            if (mainCtx) {
                mainCtx.drawImage(canvas, 0, 0)
            }
        }
    }

    private drawSVGPath(
        ctx: CanvasRenderingContext2D,
        svgPath: string,
        x: number,
        y: number,
        scale: number = 1
    ) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        // 创建 Path2D 对象
        const path = new Path2D(svgPath);
        // 填充路径
        ctx.fillStyle = this.drawStampConfigs.primaryColor;
        ctx.fill(path);

        ctx.restore();
    }

        
    // 添加绘制图片列表的方法
    private async drawImageList(
        ctx: CanvasRenderingContext2D,
        imageList: IDrawImage[],
        centerX: number,
        centerY: number
    ) {
        for (const image of imageList) {
            if (image.imageUrl) {
                // 检查缓存中是否已有该图片
                let img = this.imageCache.get(image.imageUrl);
                
                if (img) {
                    this.drawSingleImage(ctx, img, image, centerX, centerY);
                } else {
                    try {
                        // 创建一个新的图片对象
                        const tempImg = new Image();
                        tempImg.src = image.imageUrl;
                        
                        // 等待图片加载完成
                        await new Promise((resolve, reject) => {
                            tempImg.onload = resolve;
                            tempImg.onerror = reject;
                        });
                        
                        // 将图片转换为 ImageBitmap
                        const bitmap = await createImageBitmap(tempImg);
                        
                        // 存入缓存
                        this.imageCache.set(image.imageUrl, bitmap);
                        
                        // 绘制图片
                        this.drawSingleImage(ctx, bitmap, image, centerX, centerY);
                        
                        requestAnimationFrame(() => {
                            this.refreshStamp();
                        });
                    } catch (error) {
                        console.error("Error loading or processing image:", error);
                    }
                }
            }
        }
    }

    // 添加绘制单个图片的方法
    private drawSingleImage(
        ctx: CanvasRenderingContext2D,
        img: ImageBitmap,
        imageConfig: IDrawImage,
        centerX: number,
        centerY: number
    ) {
        // 计算绘制尺寸
        let width = imageConfig.imageWidth * this.mmToPixel;
        let height = imageConfig.imageHeight * this.mmToPixel;
        
        if (imageConfig.keepAspectRatio) {
            // 如果需要保持宽高比，计算缩放比例
            const scale = Math.min(width / img.width, height / img.height);
            width = img.width * scale;
            height = img.height * scale;
        }
        
        // 计算绘制位置（考虑偏移）
        const x = centerX - width / 2 + imageConfig.positionX * this.mmToPixel;
        const y = centerY - height / 2 + imageConfig.positionY * this.mmToPixel;
        
        ctx.save();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
    }

    // 修改 clearImageCache 方法
    public async clearImageCache() {
        // 关闭所有 ImageBitmap
        for (const bitmap of this.imageCache.values()) {
            bitmap.close();
        }
        this.imageCache.clear();
    }

    /**
     * 绘制五角星
     * @param canvasCtx 画笔
     * @param x 圆心x坐标
     * @param y 圆心y坐标
     * @param r 半径
     */
    private async drawStarShape(
        ctx: CanvasRenderingContext2D,
        starConfig: IDrawStar,
        centerX: number,
        centerY: number
    ) {
        const drawStarDia = starConfig.starDiameter / 2 * this.mmToPixel;
        if (starConfig.svgPath.startsWith('<svg')) {
            this.drawSVGContent(ctx, starConfig.svgPath, centerX, centerY, 1);
        } else {
            this.drawSVGPath(ctx, starConfig.svgPath, centerX, centerY, drawStarDia);
        }
    }

    private drawSVGContent(ctx: CanvasRenderingContext2D, svgContent: string, x: number, y: number, scale: number = 1) {
        // 创建一个临时的 SVG 元素
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.innerHTML = svgContent;
        const svgContentEle = svgElement.firstChild as SVGElement

        // 获取 SVG 的宽度和高度
        const svgWidth = parseFloat(svgContentEle.getAttribute('width') || '0');
        const svgHeight = parseFloat(svgContentEle.getAttribute('height') || '0');

        // 创建一个新的 Image 对象
        const img = new Image();

        // 将 SVG 转换为 data URL
        const svgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);

        // 当图片加载完成时在 canvas 上绘制它
        img.onload = () => {
            console.log("svg content img loaded", x, y, svgWidth, svgHeight, img);
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            ctx.drawImage(img, -svgWidth / 2, -svgHeight / 2, svgWidth, svgHeight);
            ctx.restore();

            // 清理 URL 对象
            URL.revokeObjectURL(url);
        };

        // 设置图片源为 SVG 的 data URL
        img.src = url;

        // 添加错误处理
        img.onerror = (error) => {
            console.error("加载SVG图像时出错:", error);
        };
    }

    /**
     * 绘制印章类型文字
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     * @param radius 半径
     * @param text 文字
     * @param fontSize 字体大小
     * @param letterSpacing 字符间距
     * @param positionY 文字位置
     * @param fillColor 填充颜色
     */
    private drawStampType(
        ctx: CanvasRenderingContext2D,
        stampType: IStampType,
        centerX: number,
        centerY: number,
        radiusX: number
    ) {
        const fontSize = stampType.fontHeight * this.mmToPixel
        const letterSpacing = stampType.letterSpacing
        const positionY = stampType.positionY
        const fontWeight = stampType.fontWeight || 'normal';
        const lineSpacing = stampType.lineSpacing * this.mmToPixel; // 新增：行间距

        ctx.save()
        ctx.font = `${fontWeight} ${fontSize}px ${stampType.fontFamily}`
        ctx.fillStyle = this.drawStampConfigs.primaryColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 将印章类型文字按换行符分割成多行
        const lines = stampType.stampType.split('\n');
        const lineCount = lines.length;

        lines.forEach((line, lineIndex) => {
            const chars = line.split('')
            const charWidths = chars.map((char) => ctx.measureText(char).width)
            const totalWidth =
                charWidths.reduce((sum, width) => sum + width, 0) +
                (chars.length - 1) * letterSpacing * this.mmToPixel

            // 计算每行的垂直偏移，使用新的 lineSpacing
            const lineOffset = (lineIndex - (lineCount - 1) / 2) * (fontSize + lineSpacing);

            // 计算文字位置（在五角星正下方）
            const textY = centerY + radiusX * 0.5 + positionY * this.mmToPixel + lineOffset

            ctx.save()
            ctx.translate(centerX, textY)

            let currentX = -totalWidth / 2 // 从文本的左边缘开始

            ctx.scale(stampType.compression, 1)
            chars.forEach((char, index) => {
                ctx.fillText(char, currentX + charWidths[index] / 2, 0) // 绘制在字符的中心
                currentX += charWidths[index] + letterSpacing * this.mmToPixel
            })

            ctx.restore()
        });

        ctx.restore()
    }

    private drawStampTypeList(
        ctx: CanvasRenderingContext2D,
        stampTypeList: IStampType[],
        centerX: number,
        centerY: number,
        radiusX: number
    ) {
        stampTypeList.forEach((stampType) => {
            this.drawStampType(ctx, stampType, centerX, centerY, radiusX)
        })
        ctx.restore()
    }

    /**
     * 绘制防伪纹路
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     * @param radiusX 半径x
     * @param radiusY 半径y
     * @param securityPatternWidth 纹路宽度
     * @param securityPatternLength 纹路长度
     */
    private drawSecurityPattern(
        ctx: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        forceRefresh: boolean
    ) {
        if (!this.securityPattern.openSecurityPattern) return

        ctx.save()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = this.securityPattern.securityPatternWidth * this.mmToPixel
        ctx.globalCompositeOperation = 'destination-out'

        const angleRangeRad = (this.securityPattern.securityPatternAngleRange * Math.PI) / 180

        // 如果需要刷新或者参数数组为空,则重新生成参数
        if (forceRefresh || this.drawStampConfigs.securityPattern.securityPatternParams.length === 0) {
            this.drawStampConfigs.securityPattern.securityPatternParams = []
            for (let i = 0; i < this.securityPattern.securityPatternCount; i++) {
                const angle = Math.random() * Math.PI * 2
                const normalAngle = Math.atan2(radiusY * Math.cos(angle), radiusX * Math.sin(angle))
                const lineAngle = normalAngle + (Math.random() - 0.5) * angleRangeRad
                this.drawStampConfigs.securityPattern.securityPatternParams.push({angle, lineAngle})
            }
        }

        // 使用保存的参数制纹路
        this.drawStampConfigs.securityPattern.securityPatternParams.forEach(({angle, lineAngle}) => {
            const x = centerX + radiusX * Math.cos(angle)
            const y = centerY + radiusY * Math.sin(angle)

            const length = this.securityPattern.securityPatternLength * this.mmToPixel
            const startX = x - (length / 2) * Math.cos(lineAngle)
            const startY = y - (length / 2) * Math.sin(lineAngle)
            const endX = x + (length / 2) * Math.cos(lineAngle)
            const endY = y + (length / 2) * Math.sin(lineAngle)

            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
        })

        ctx.restore()
    }

    /**
     * 绘制椭圆
     * @param x 圆心x坐标
     * @param y 圆心y坐标
     * @param radiusX 半径x
     * @param radiusY 半径y
     * @param borderWidth 边框宽度
     * @param borderColor 边框颜色
     */
    private drawEllipse(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radiusX: number,
        radiusY: number,
        borderWidth: number,
        borderColor: string
    ) {
        ctx.beginPath()
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth
        ctx.stroke()
    }

    /**
     * 绘制公司名称
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     * @param radiusX 椭圆长轴半径
     * @param radiusY 椭圆短轴半径
     * @param text 公司名称文本
     * @param fontSize 字体大小
     */
    private drawCompanyName(
        ctx: CanvasRenderingContext2D,
        company: ICompany,
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number
      ) {
        const fontSize = company.fontHeight * this.mmToPixel
        const fontWeight = company.fontWeight || 'normal'
        ctx.save()
        ctx.font = `${fontWeight} ${fontSize}px ${company.fontFamily}`
        ctx.fillStyle = this.drawStampConfigs.primaryColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
      
        const characters = company.companyName.split('')
        const characterCount = characters.length
        const borderOffset = company.borderOffset * this.mmToPixel
      
        // 计算总角度和每个字符的角度
        const totalAngle = Math.PI * (0.5 + characterCount / (company.textDistributionFactor * 4))
        const anglePerChar = totalAngle / characterCount
      
        // 根据旋转方向设置起始角度和角度增量
        const direction = company.rotateDirection === 'clockwise' ? -1 : 1
        const startAngle = (company.startAngle ? company.startAngle : 0) + (company.rotateDirection === 'clockwise' ? 
          Math.PI - totalAngle / 2 : 
          Math.PI + (Math.PI - totalAngle) / 2)
      
        // 计算字符位置时考虑椭圆文字调整
        if (company.adjustEllipseText) {
          const halfCharCount = (characterCount + 1) / 2
      
          characters.forEach((char, index) => {
            // 计算当前字符的角度，包含椭圆调整
            const halfIndex = halfCharCount - index - 1
            const adjustmentFactor = Math.pow(halfIndex / halfCharCount, 2)
            const additionalAngle = adjustmentFactor * anglePerChar * company.adjustEllipseTextFactor
            const indexValue = index - halfCharCount
            const factor = indexValue / Math.abs(indexValue)
      
            let angle = startAngle + direction * anglePerChar * (index + 0.5)
            angle += additionalAngle * factor
      
            // 计算字符位置
            const x = centerX + Math.cos(angle) * (radiusX - fontSize - borderOffset)
            const y = centerY + Math.sin(angle) * (radiusY - fontSize - borderOffset)
      
            ctx.save()
            ctx.translate(x, y)
            // 根据旋转方向调整文字旋转角度
            ctx.rotate(angle + (company.rotateDirection === 'clockwise' ? -Math.PI/2 : Math.PI/2))
            ctx.scale(company.compression, 1)
            ctx.fillText(char, 0, 0)
            ctx.restore()
          })
        } else {
          // 不调整椭圆文字时的正常绘制
          characters.forEach((char, index) => {
            const angle = startAngle + direction * anglePerChar * (index + 0.5)
            
            const x = centerX + Math.cos(angle) * (radiusX - fontSize - borderOffset)
            const y = centerY + Math.sin(angle) * (radiusY - fontSize - borderOffset)
      
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle + (company.rotateDirection === 'clockwise' ? -Math.PI/2 : Math.PI/2))
            ctx.scale(company.compression, 1)
            ctx.fillText(char, 0, 0)
            ctx.restore()
          })
        }
      
        ctx.restore()
      }

    /**
     * 绘制印章编码
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     * @param radiusX 椭圆长轴半径
     * @param radiusY 椭圆短轴半径
     * @param text 编码文本
     * @param fontSize 字大小
     */
    private drawCode(
        ctx: CanvasRenderingContext2D,
        code: ICode,
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number
    ) {
        const fontSize = code.fontHeight * this.mmToPixel
        const text = code.code
        const fontWeight = code.fontWeight || 'normal'; // 新增字体粗细参数

        ctx.save()
        ctx.font = `${fontWeight} ${fontSize}px ${code.fontFamily}`;
        ctx.fillStyle = this.drawStampConfigs.primaryColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const characters = text.split('')
        const characterCount = characters.length
        // 处理单个字符的情况
        if (characterCount === 1) {
            // 单个字符直接绘制在底部中心位置
            const x = centerX
            const y = centerY + radiusY - fontSize - code.borderOffset * this.mmToPixel

            ctx.save()
            ctx.translate(x, y)
            ctx.scale(code.compression, 1)
            ctx.fillText(text, 0, 0)
            ctx.restore()
        } else {
            // 多个字符时的弧形排列
            const totalAngle = Math.PI * ((1 + characterCount) / code.textDistributionFactor)
            const startAngle = Math.PI / 2 + totalAngle / 2
            const anglePerChar = totalAngle / (characterCount - 1)

            characters.forEach((char, index) => {
                const angle = startAngle - anglePerChar * index
                const x = centerX + Math.cos(angle) * (radiusX - fontSize / 2 - code.borderOffset * this.mmToPixel)
                const y = centerY + Math.sin(angle) * (radiusY - fontSize / 2 - code.borderOffset * this.mmToPixel)

                ctx.save()
                ctx.translate(x, y)
                ctx.rotate(angle - Math.PI / 2)
                ctx.scale(code.compression, 1)
                ctx.fillText(char, 0, 0)
                ctx.restore()
            })
        }

        ctx.restore()
    }

    /**
     * 绘制税号
     * @param ctx 画布上下文
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     */
    private drawTaxNumber(
        ctx: CanvasRenderingContext2D,
        taxNumber: ITaxNumber,
        centerX: number,
        centerY: number
    ) {
        const fontSize = taxNumber.fontHeight * this.mmToPixel
        const totalWidth = taxNumber.totalWidth * this.mmToPixel
        const positionY = taxNumber.positionY * this.mmToPixel + 0.3
        const fontWeight = taxNumber.fontWeight || 'normal'; // 新增字体粗细参数

        ctx.save()

        ctx.font = `${fontWeight} ${fontSize}px ${taxNumber.fontFamily}`;
        ctx.fillStyle = this.drawStampConfigs.primaryColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const characters = taxNumber.code.split('')
        const charCount = characters.length
        const letterSpacing = this.drawStampConfigs.taxNumber.letterSpacing * this.mmToPixel

        // 计算压缩后的总宽度
        const compressedTotalWidth = totalWidth * this.drawStampConfigs.taxNumber.compression

        // 计算单个字符的宽度（考虑压缩）
        const charWidth = (compressedTotalWidth - (charCount - 1) * letterSpacing) / charCount

        // 计算整个文本的实际宽度
        const actualWidth = charCount * charWidth + (charCount - 1) * letterSpacing

        // 计算起始位置，确保文居中
        const startX = centerX - actualWidth / 2 + charWidth / 2
        const adjustedCenterY = centerY + positionY * this.mmToPixel

        characters.forEach((char, index) => {
            const x = startX + index * (charWidth + letterSpacing)
            ctx.save()
            ctx.translate(x, adjustedCenterY)
            ctx.scale(this.drawStampConfigs.taxNumber.compression, 1.35)
            ctx.fillText(char, 0, 0)
            ctx.restore()
        })
        ctx.restore()
    }

    /**
     * 添加毛边效果
     * @param ctx 画布上下文
     * @param centerX 圆心x坐标
     * @param centerY 圆心y坐标
     * @param radiusX 椭圆长轴半径
     * @param radiusY 椭圆短轴半径
     * @param borderWidth 边框宽度
     */
    private addRoughEdge(
        ctx: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        borderWidth: number,
        forceRefresh: boolean = false
    ) {
        const roughness = borderWidth * this.drawStampConfigs.roughEdge.roughEdgeHeight * 0.01
        const points = this.drawStampConfigs.roughEdge.roughEdgePoints;
        const outwardShift = this.drawStampConfigs.roughEdge.roughEdgeShift;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.globalCompositeOperation = 'destination-out';

        // 如果需要刷新或者参数数组为空,则重新生成参数
        if (forceRefresh || this.drawStampConfigs.roughEdge.roughEdgeParams.length === 0) {
            this.drawStampConfigs.roughEdge.roughEdgeParams = [];
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const shouldDraw = Math.random() > this.drawStampConfigs.roughEdge.roughEdgeProbability; // 增加概率以获得更稀疏的效果
                const size = shouldDraw ? Math.random() * roughness * Math.random() + this.drawStampConfigs.roughEdge.roughEdgeWidth : 0; // 减小圆形大小
                this.drawStampConfigs.roughEdge.roughEdgeParams.push({angle, size, offset: outwardShift, opacity: 1});
            }
        }

        // 使用保存的参数绘制毛边
        this.drawStampConfigs.roughEdge.roughEdgeParams.forEach(({angle, size}) => {
            const x = centerX + Math.cos(angle) * (radiusX + outwardShift);
            const y = centerY + Math.sin(angle) * (radiusY + outwardShift);

            if (size > 0) {
                ctx.beginPath();
                ctx.arc(x, y, size * this.mmToPixel, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    /**
     * 添加做旧效果
     * @param width 画布宽度
     * @param height 画布高度
     * @param forceRefresh 是否强制刷新
     */
    private addAgingEffect(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        forceRefresh: boolean = false
    ) {
        if (!this.drawStampConfigs.agingEffect.applyAging) return;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const centerX = width / (2 * this.scale) + this.stampOffsetX * this.mmToPixel / this.scale;
        const centerY = height / (2 * this.scale) + this.stampOffsetY * this.mmToPixel / this.scale;
        const radius = (Math.max(width, height) / 2) * this.mmToPixel / this.scale;


        // 如果需要刷新或者参数数组为空,则重新生成参数
        if (forceRefresh || this.drawStampConfigs.agingEffect.agingEffectParams.length === 0) {
            this.drawStampConfigs.agingEffect.agingEffectParams = []
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4
                    const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
                    if (
                        distanceFromCenter <= radius &&
                        data[index] > 200 &&
                        data[index + 1] < 50 &&
                        data[index + 2] < 50
                    ) {
                        const intensityFactor = this.drawStampConfigs.agingEffect.agingIntensity / 100
                        const seed = Math.random()
                        this.drawStampConfigs.agingEffect.agingEffectParams.push({
                            x: x - this.stampOffsetX * this.mmToPixel,
                            y: y - this.stampOffsetY * this.mmToPixel,
                            noiseSize: Math.random() * 3 + 1,
                            noise: Math.random() * 200 * intensityFactor,
                            strongNoiseSize: Math.random() * 5 + 2,
                            strongNoise: Math.random() * 250 * intensityFactor + 5,
                            fade: Math.random() * 50 * intensityFactor,
                            seed: seed
                        })
                    }
                }
            }
        }

        // 使用保存的参数应用做旧效果
        this.drawStampConfigs.agingEffect.agingEffectParams.forEach((param) => {
            const {x, y, noiseSize, noise, strongNoiseSize, strongNoise, fade, seed} = param
            const adjustedX = x + this.stampOffsetX * this.mmToPixel
            const adjustedY = y + this.stampOffsetY * this.mmToPixel
            const index = (Math.round(adjustedY) * width + Math.round(adjustedX)) * 4

            if (seed < 0.4) {
                this.addCircularNoise(data, width, adjustedX, adjustedY, noiseSize, noise, true)
            }

            if (seed < 0.05) {
                this.addCircularNoise(data, width, adjustedX, adjustedY, strongNoiseSize, strongNoise, true)
            }

            if (seed < 0.2) {
                data[index + 3] = Math.max(0, data[index + 3] - fade) // 修改这里，只改变透明度
            }
        })

        ctx.putImageData(imageData, 0, 0)
    }

    private addCircularNoise(
        data: Uint8ClampedArray,
        width: number,
        x: number,
        y: number,
        size: number,
        intensity: number,
        transparent: boolean = false
    ) {
        const radiusSquared = (size * size) / 4
        for (let dy = -size / 2; dy < size / 2; dy++) {
            for (let dx = -size / 2; dx < size / 2; dx++) {
                if (dx * dx + dy * dy <= radiusSquared) {
                    const nx = Math.round(x + dx)
                    const ny = Math.round(y + dy)
                    const nIndex = (ny * width + nx) * 4
                    if (nIndex >= 0 && nIndex < data.length) {
                        if (transparent) {
                            data[nIndex + 3] = Math.max(0, data[nIndex + 3] - intensity) // 只改变透明度
                        } else {
                            data[nIndex] = Math.min(255, data[nIndex] + intensity)
                            data[nIndex + 1] = Math.min(255, data[nIndex + 1] + intensity)
                            data[nIndex + 2] = Math.min(255, data[nIndex + 2] + intensity)
                        }
                    }
                }
            }
        }
    }

    /**
     * 绘制全尺寸标尺
     * @param width 画布宽度
     * @param height 画布高度
     */
    private drawFullRuler(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (!this.ruler.showFullRuler) return;

        ctx.save();
        ctx.strokeStyle = '#bbbbbb'; // 浅灰色
        ctx.lineWidth = 1; // 保持线宽不变
        ctx.setLineDash([5, 5]); // 保持虚线样式不变

        const step = this.mmToPixel * 5; // 5mm的像素长度

        // 绘制垂直线
        for (let x = RULER_WIDTH; x < width; x += step * this.scale) {
            ctx.beginPath();
            ctx.moveTo(x, RULER_HEIGHT);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // 绘制水平线
        for (let y = RULER_HEIGHT; y < height; y += step * this.scale) {
            ctx.beginPath();
            ctx.moveTo(RULER_WIDTH, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 绘制标尺
     * @param rulerLength 标尺长度
     * @param rulerSize 标尺宽度
     * @param isHorizontal 是否为水平标尺
     */
    private drawRuler(
        ctx: CanvasRenderingContext2D,
        rulerLength: number,
        rulerSize: number,
        isHorizontal: boolean
    ) {
        if (!this.ruler.showRuler) return;

        const mmPerPixel = 1 / this.mmToPixel;

        ctx.save();
        ctx.fillStyle = 'lightgray';
        if (isHorizontal) {
            ctx.fillRect(0, 0, rulerLength, rulerSize);
        } else {
            ctx.fillRect(0, 0, rulerSize, rulerLength);
        }

        ctx.fillStyle = 'black';
        ctx.font = '10px Arial'; // 保持字体大小不变
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const step = this.mmToPixel; // 1mm的像素长度
        const maxMM = Math.ceil((rulerLength - rulerSize) * mmPerPixel / this.scale);

        for (let mm = 0; mm <= maxMM; mm++) {
            const pos = mm * step * this.scale + rulerSize;

            if (mm % 5 === 0) {
                ctx.beginPath();
                if (isHorizontal) {
                    ctx.moveTo(pos, 0);
                    ctx.lineTo(pos, rulerSize * 0.8);
                } else {
                    ctx.moveTo(0, pos);
                    ctx.lineTo(rulerSize * 0.8, pos);
                }
                ctx.lineWidth = 1; // 保持线宽不变
                ctx.stroke();

                ctx.save();
                if (isHorizontal) {
                    ctx.fillText(mm.toString(), pos, rulerSize * 0.8);
                } else {
                    ctx.translate(rulerSize * 0.8, pos);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(mm.toString(), 0, 0);
                }
                ctx.restore();
            } else {
                ctx.beginPath();
                if (isHorizontal) {
                    ctx.moveTo(pos, 0);
                    ctx.lineTo(pos, rulerSize * 0.6);
                } else {
                    ctx.moveTo(0, pos);
                    ctx.lineTo(rulerSize * 0.6, pos);
                }
                ctx.lineWidth = 0.5; // 保持线宽不变
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * 将印章保存为PNG图片
     * @param outputSize 输出图片的尺寸
     */
    saveStampAsPNG(outputSize: number = 512) {
        // 首先隐藏虚线
        this.drawStampConfigs.ruler.showCrossLine = false
        this.drawStampConfigs.ruler.showRuler = false
        this.drawStampConfigs.ruler.showDashLine = false
        this.drawStampConfigs.ruler.showSideRuler = false
        this.drawStampConfigs.ruler.showFullRuler = false
        this.drawStampConfigs.ruler.showCurrentPositionText = false
        this.refreshStamp()
        setTimeout(() => {
            // 创建一个新的 canvas 元素，大小为 outputSize x outputSize
            const saveCanvas = document.createElement('canvas')
            saveCanvas.width = outputSize
            saveCanvas.height = outputSize
            const saveCtx = saveCanvas.getContext('2d')
            if (!saveCtx) return

            // 清除画布，使背景透明
            saveCtx.clearRect(0, 0, outputSize, outputSize)

            // 计算原始 canvas 中印章的位置和大小
            const originalStampSize =
                (Math.max(this.drawStampConfigs.width, this.drawStampConfigs.height) + 2) * this.mmToPixel
            const sourceX =
                (this.canvas.width - originalStampSize) / 2 + this.stampOffsetX * this.mmToPixel
            const sourceY =
                (this.canvas.height - originalStampSize) / 2 + this.stampOffsetY * this.mmToPixel

            // 设置2%的边距
            const margin = outputSize * 0.01
            const drawSize = outputSize - 2 * margin

            // 将原始 canvas 中的印章部分绘制到新的 canvas 上，并调整大小
            saveCtx.drawImage(
                this.canvas,
                sourceX,
                sourceY,
                originalStampSize,
                originalStampSize,
                margin,
                margin,
                drawSize,
                drawSize
            )

            // 如果启用了做旧效果，在新的 canvas 上应用做旧效果
            if (this.drawStampConfigs.agingEffect.applyAging) {
                this.addAgingEffect(saveCtx, outputSize, outputSize, false)
            }

            // 将的 canvas 转为 PNG 数据 URL
            const dataURL = saveCanvas.toDataURL('image/png')

            // 创建一个临时的 <a> 元素来触发下载
            const link = document.createElement('a')
            link.href = dataURL
            link.download = '印章.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // 恢复标尺
            this.drawStampConfigs.ruler.showCrossLine = true
            this.drawStampConfigs.ruler.showRuler = true
            this.drawStampConfigs.ruler.showDashLine = true
            this.drawStampConfigs.ruler.showSideRuler = true
            this.drawStampConfigs.ruler.showFullRuler = true
            this.drawStampConfigs.ruler.showCurrentPositionText = true
            this.refreshStamp()
        }, 50)
    }

    /**
     * 刷新印章绘制
     * @param refreshSecurityPattern 是否刷新防伪纹路
     * @param refreshOld 是否刷新做旧效果
     * @param refreshRoughEdge 是否刷新毛边效果
     */
    refreshStamp(refreshSecurityPattern: boolean = false, refreshOld: boolean = false, refreshRoughEdge: boolean = false) {
        // 清除整个画布
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 保存当前状态
        this.canvasCtx.save();

        // 应用缩放和平移
        this.canvasCtx.translate(this.offsetX, this.offsetY);
        this.canvasCtx.scale(this.scale, this.scale);

        // 计算画布中心点
        const x = this.canvas.width / 2 / this.scale;
        const y = this.canvas.height / 2 / this.scale;
        const mmToPixel = this.mmToPixel;
        const drawRadiusX = (this.drawStampConfigs.width - this.drawStampConfigs.borderWidth) / 2;
        const drawRadiusY = (this.drawStampConfigs.height - this.drawStampConfigs.borderWidth) / 2;
        const offsetX = this.stampOffsetX * this.mmToPixel;
        const offsetY = this.stampOffsetY * this.mmToPixel;
        const centerX = x + offsetX;
        const centerY = y + offsetY;
        this.drawStamp(
            this.canvasCtx,
            centerX,
            centerY,
            drawRadiusX * mmToPixel,
            drawRadiusY * mmToPixel,
            this.drawStampConfigs.borderWidth * mmToPixel,
            this.drawStampConfigs.primaryColor,
            refreshSecurityPattern,
            refreshOld,
            refreshRoughEdge
        )
        // 恢复状态
        this.canvasCtx.restore();
        // 绘制标尺（如果需要）
        if (this.drawStampConfigs.ruler.showRuler) {
            if(this.drawStampConfigs.ruler.showSideRuler){
                this.drawRuler(this.canvasCtx, this.canvas.width, RULER_HEIGHT, true);
                this.drawRuler(this.canvasCtx, this.canvas.height, RULER_HEIGHT, false);
            }
            if(this.drawStampConfigs.ruler.showDashLine) {
                this.drawFullRuler(this.canvasCtx, this.canvas.width, this.canvas.height);
            }
        }
    }

    /**
     * 重置缩放比例为100%
     */
    resetZoom() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.refreshStamp();
    }

    // 添加绘制公司列表的方法
    private drawCompanyList(
        ctx: CanvasRenderingContext2D,
        companyList: ICompany[],
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number
    ) {
        companyList.forEach((company) => {
            this.drawCompanyName(ctx, company, centerX, centerY, radiusX, radiusY)
        })
    }

    // 绘制内圈列表
    private drawInnerCircleList(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, borderColor: string) {
        const innerCircleList = this.drawStampConfigs.innerCircleList
        innerCircleList.forEach((innerCircle) => {
            if (innerCircle.drawInnerCircle) {
                this.drawInnerCircle(ctx, centerX, centerY, borderColor, innerCircle)
            }
        })
    }

    // 绘制内圈
    private drawInnerCircle(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, borderColor: string, innerCircle: IInnerCircle) {
        const innerCircleWidth = (innerCircle.innerCircleLineRadiusX - innerCircle.innerCircleLineWidth) / 2
        const innerCircleHeight = (innerCircle.innerCircleLineRadiusY - innerCircle.innerCircleLineWidth) / 2
        this.drawEllipse(
            ctx,
            centerX,
            centerY,
            innerCircleWidth * this.mmToPixel,
            innerCircleHeight * this.mmToPixel,
            innerCircle.innerCircleLineWidth * this.mmToPixel,
            borderColor
        )
    }

    /**
     * 绘制印章
     * @param x 圆心x坐标
     * @param y 圆心y坐标
     * @param radiusX 半径x
     * @param radiusY 半径y
     * @param borderWidth 边框宽度
     * @param borderColor 边框颜色
     * @param refreshSecurityPattern 是否刷新防伪纹路
     * @param refreshOld 是否刷新做旧效果
     * @param refreshRoughEdge 是否刷新毛边效果
     */
    drawStamp(
        ctx: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        borderWidth: number,
        borderColor: string,
        refreshSecurityPattern: boolean = false,
        refreshOld: boolean = false,
        refreshRoughEdge: boolean = false
    ) {
        // 清除整个画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        // 在离屏 canvas 上绘制
        const offscreenCanvas = this.offscreenCanvas
        offscreenCanvas.width = this.canvas.width
        offscreenCanvas.height = this.canvas.height
        const offscreenCtx = offscreenCanvas.getContext('2d')
        if (!offscreenCtx) return
        // 创建一个临时的 canvas 用于存储原始图片
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = this.canvas.width
        tempCanvas.height = this.canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return
        // 先在临时 canvas 上绘制图片（如果有的话）
        if (this.drawStampConfigs.drawStar.drawStar && this.drawStampConfigs.drawStar.useImage) {
            this.drawStarShape(tempCtx, this.drawStampConfigs.drawStar, centerX, centerY)
        }
        // 在离屏 canvas 上绘制印章基本形状
        offscreenCtx.beginPath()
        offscreenCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        offscreenCtx.strokeStyle = this.drawStampConfigs.primaryColor
        offscreenCtx.lineWidth = borderWidth
        offscreenCtx.stroke()
        // 创建裁剪区域
        offscreenCtx.save()
        offscreenCtx.beginPath()
        offscreenCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        offscreenCtx.clip()
        // 绘制内圈列表
        if (this.drawStampConfigs.innerCircleList.length > 0) {
            this.drawInnerCircleList(offscreenCtx, centerX, centerY, borderColor)
        }
        // 如果没有图片，绘制五角星
        if (this.drawStampConfigs.drawStar.drawStar && !this.drawStampConfigs.drawStar.useImage) {
            this.drawStarShape(offscreenCtx, this.drawStampConfigs.drawStar, centerX, centerY)
        }
        // 绘制图片列表
        if (this.drawStampConfigs.imageList && this.drawStampConfigs.imageList.length > 0) {
            this.drawImageList(offscreenCtx, this.drawStampConfigs.imageList, centerX, centerY)
        }
        // 绘制文字内容
        this.drawCompanyList(offscreenCtx, this.drawStampConfigs.companyList, centerX, centerY, radiusX, radiusY)
        this.drawStampTypeList(offscreenCtx, this.drawStampConfigs.stampTypeList, centerX, centerY, radiusX)
        this.drawCode(offscreenCtx, this.drawStampConfigs.stampCode, centerX, centerY, radiusX, radiusY)
        this.drawTaxNumber(offscreenCtx, this.drawStampConfigs.taxNumber, centerX, centerY)
        offscreenCtx.restore()
        // 将离屏 canvas 的内容绘制到主 canvas
        ctx.save()
        // 先绘制临时 canvas 上的图片（如果有的话）
        if (this.drawStampConfigs.drawStar.drawStar && this.drawStampConfigs.drawStar.useImage) {
            ctx.drawImage(tempCanvas, 0, 0)
        }
        // 添加毛边效果
        if (this.drawStampConfigs.roughEdge.drawRoughEdge) {
            this.addRoughEdge(offscreenCtx, centerX, centerY, radiusX, radiusY, borderWidth, refreshRoughEdge)
        }
        if(this.drawStampConfigs.securityPattern.openSecurityPattern) {
            // 绘制防伪纹路
            this.drawSecurityPattern(offscreenCtx, centerX, centerY, radiusX, radiusY, refreshSecurityPattern)
        }

        // 设置合成模式，确保印章内容只在椭圆区域内显示
        ctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(offscreenCanvas, 0, 0)
        ctx.restore()
        // 添加做旧效果
        if (this.drawStampConfigs.agingEffect.applyAging) {
            this.addAgingEffect(ctx, this.canvas.width, this.canvas.height, refreshOld)
        }
    }
}
